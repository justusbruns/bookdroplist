import { NextRequest, NextResponse } from 'next/server'
import { extractBooksFromImage } from '@/lib/gemini'
import { enrichBookData, getBookByISBN } from '@/lib/openLibrary'
import { geocodeLocation, fuzzLocation } from '@/lib/location'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/session'
import { v4 as uuidv4 } from 'uuid'
import type { Book } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    let session
    try {
      session = await requireAuth()
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const latitude = formData.get('latitude') as string
    const longitude = formData.get('longitude') as string

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Extract books from image using Gemini
    const extractedBooks = await extractBooksFromImage(file)
    console.log('Extracted books from Gemini:', extractedBooks)

    if (extractedBooks.length === 0) {
      return NextResponse.json({ error: 'No books found in the image' }, { status: 400 })
    }

    // Enrich book data and save to database
    const books: Book[] = []

    for (const extractedBook of extractedBooks) {
      let enrichedData: Partial<Book> = {}
      let finalAuthor = extractedBook.author
      let finalTitle = extractedBook.title

      // For ISBN detection, try direct lookup first
      if (extractedBook.isbn) {
        console.log('Attempting direct ISBN lookup for:', extractedBook.isbn)
        const isbnData = await getBookByISBN(extractedBook.isbn)
        if (isbnData) {
          enrichedData = isbnData
          // Use data from ISBN lookup if better than extracted data
          if (isbnData.title && isbnData.title !== 'Unknown Title') {
            finalTitle = isbnData.title
          }
          if (isbnData.author && isbnData.author !== 'Unknown Author') {
            finalAuthor = isbnData.author
          }
        }
      }

      // If ISBN lookup didn't provide enough data, try traditional enrichment
      if (!enrichedData.cover_url || !enrichedData.publisher) {
        console.log('Enriching book data for:', finalTitle, finalAuthor || extractedBook.publisher)
        const additionalData = await enrichBookData(
          finalTitle,
          finalAuthor,
          extractedBook.publisher
        )
        enrichedData = { ...additionalData, ...enrichedData } // ISBN data takes priority
      }

      const book: Book = {
        id: uuidv4(),
        title: finalTitle,
        author: finalAuthor || enrichedData.author || extractedBook.publisher || 'Unknown',
        ...enrichedData,
        // Preserve extracted data
        ...(extractedBook.publisher ? { publisher: extractedBook.publisher } : {}),
        ...(extractedBook.isbn ? { isbn: extractedBook.isbn } : {})
      }

      console.log('Attempting to insert book:', book)

      // Insert book into database (ignore conflicts for now)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedBook, error: bookError } = await (supabase as any)
        .from('books')
        .insert(book)
        .select()
        .single()

      if (bookError) {
        console.error('Error inserting book:', bookError)

        // For unique constraint violations, we need to fetch the existing book
        if (bookError.code === '23505') {
          console.log('Book already exists, fetching existing book')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: existingBook } = await (supabase as any)
            .from('books')
            .select('*')
            .eq('title', book.title)
            .eq('author', book.author)
            .single()

          if (existingBook) {
            // Use the existing book's ID instead of the generated one
            books.push({ ...existingBook })
          } else {
            books.push(book)
          }
        } else {
          // Other errors, still add to list but log the issue
          console.error('Failed to insert book, adding to list anyway:', book)
          books.push(book)
        }
      } else {
        console.log('Book inserted successfully:', insertedBook || book)
        // Use the inserted book data which has the correct ID
        books.push(insertedBook || book)
      }
    }

    // Process location if provided
    let locationData = {}
    if (latitude && longitude) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)

      // Get location details via geocoding
      const geocodeResult = await geocodeLocation(lat, lng)

      // Create fuzzy location for privacy
      const fuzzyLocation = fuzzLocation(lat, lng)

      locationData = {
        exact_latitude: lat,
        exact_longitude: lng,
        public_latitude: fuzzyLocation.latitude,
        public_longitude: fuzzyLocation.longitude,
        location_name: geocodeResult?.location_name,
        city: geocodeResult?.city,
        country: geocodeResult?.country
      }
    }

    // Create a new list
    const shareUrl = uuidv4()
    const listId = uuidv4()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: listError } = await (supabase as any)
      .from('lists')
      .insert({
        id: listId,
        name: 'My Book List',
        share_url: shareUrl,
        user_id: session.userId,
        ...locationData
      })

    if (listError) {
      console.error('Error creating list:', listError)
      return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
    }

    console.log('Linking books to list:', { listId, bookIds: books.map(b => b.id) })

    // Link books to the list
    for (let i = 0; i < books.length; i++) {
      console.log(`Linking book ${i + 1}/${books.length}:`, books[i])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: linkError } = await (supabase as any)
        .from('list_books')
        .insert({
          list_id: listId,
          book_id: books[i].id,
          position: i
        })

      if (linkError) {
        console.error('Error linking book to list:', linkError)
      } else {
        console.log(`Successfully linked book ${i + 1} to list`)
      }
    }

    return NextResponse.json({
      listId,
      shareUrl,
      books
    })

  } catch (error) {
    console.error('Error processing image:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}