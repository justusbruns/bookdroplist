import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/session'
import { v4 as uuidv4 } from 'uuid'

// Simple in-memory cache to prevent duplicate requests (resets on server restart)
const recentRequests = new Map<string, number>()

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    let session
    try {
      session = await requireAuth()
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Prevent duplicate requests within 5 seconds from the same user
    const now = Date.now()
    const lastRequest = recentRequests.get(session.userId)
    if (lastRequest && (now - lastRequest) < 5000) {
      return NextResponse.json({ error: 'Request too recent, please wait a moment' }, { status: 429 })
    }
    recentRequests.set(session.userId, now)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    const { books } = await request.json()

    if (!books || !Array.isArray(books) || books.length === 0) {
      return NextResponse.json({ error: 'At least one book is required' }, { status: 400 })
    }

    // Create the list first
    const shareUrl = uuidv4()
    const listId = uuidv4()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: listError } = await (supabaseAdmin as any)
      .from('lists')
      .insert({
        id: listId,
        name: 'My Book List',
        share_url: shareUrl,
        user_id: session.userId
      })

    if (listError) {
      console.error('Error creating list:', listError)
      return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
    }

    // Insert/update books and link them to the list
    const savedBooks = []

    for (let i = 0; i < books.length; i++) {
      const book = books[i]

      console.log(`\n=== Processing book ${i}: "${book.title}" by "${book.author}" ===`)
      console.log(`Original book ID: ${book.id}`)

      // First check if book already exists by title + author
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingBook, error: findError } = await (supabaseAdmin as any)
        .from('books')
        .select('*')
        .eq('title', book.title)
        .eq('author', book.author)
        .single()

      console.log(`Find existing book result:`, { existingBook: existingBook?.id, findError: findError?.code })

      let bookToUse = book

      if (existingBook) {
        // Book already exists, use the existing one
        console.log(`Using existing book with ID: ${existingBook.id}`)
        bookToUse = existingBook
        savedBooks.push(existingBook)
      } else {
        // Try to insert the new book
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: insertedBook, error: bookError } = await (supabaseAdmin as any)
          .from('books')
          .insert({
            title: book.title,
            author: book.author,
            cover_url: book.cover_url,
            isbn: book.isbn,
            publication_year: book.publication_year,
            publisher: book.publisher,
            description: book.description
          })
          .select()
          .single()

        if (bookError) {
          console.error('Error inserting book:', bookError)
          // If insert fails, try to find the book that caused the conflict
          if (bookError.code === '23505') {
            // Unique constraint violation - book already exists, try to find it
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: conflictBook } = await (supabaseAdmin as any)
              .from('books')
              .select('*')
              .eq('title', book.title)
              .eq('author', book.author)
              .single()

            if (conflictBook) {
              bookToUse = conflictBook
              savedBooks.push(conflictBook)
            } else {
              // Skip this book if we can't resolve it
              console.error('Could not resolve book conflict:', book.title)
              continue
            }
          } else {
            // Other error - skip this book
            console.error('Skipping book due to error:', book.title, bookError)
            continue
          }
        } else {
          console.log(`Successfully inserted book with ID: ${insertedBook?.id}`)
          bookToUse = insertedBook || book
          savedBooks.push(bookToUse)
        }
      }

      console.log(`Final bookToUse ID: ${bookToUse.id}`)

      // Link the book to the list (use the actual book ID from database)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: linkError } = await (supabaseAdmin as any)
        .from('list_books')
        .insert({
          list_id: listId,
          book_id: bookToUse.id,
          position: i
        })

      if (linkError) {
        console.error('CRITICAL: Error linking book to list:', linkError)
        // This is a critical failure. We should stop and return an error.
        // We're throwing an error here to be caught by the outer try/catch block.
        throw new Error(`Failed to link book "${bookToUse.title}" to the list. Reason: ${linkError.message}`)
      }
    }

    // Clean up old requests (older than 1 minute) to prevent memory leaks
    const oneMinuteAgo = now - 60000
    for (const [userId, timestamp] of recentRequests.entries()) {
      if (timestamp < oneMinuteAgo) {
        recentRequests.delete(userId)
      }
    }

    return NextResponse.json({
      listId,
      shareUrl,
      books: savedBooks
    })

  } catch (error) {
    console.error('Error creating manual list:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json(
      { error: `Failed to create list: ${errorMessage}` },
      { status: 500 }
    )
  }
}