import { NextRequest, NextResponse } from 'next/server'
import { extractBooksFromImage } from '@/lib/gemini'
import { enrichBookData } from '@/lib/openLibrary'
import { requireAuth } from '@/lib/session'
import { v4 as uuidv4 } from 'uuid'
import type { Book } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    let session
    try {
      session = await requireAuth()
    } catch (error) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Extract books from image using Gemini
    const extractedBooks = await extractBooksFromImage(file)
    console.log('Extracted books from Gemini:', extractedBooks)

    if (extractedBooks.length === 0) {
      return NextResponse.json({ error: 'No books found in the image' }, { status: 400 })
    }

    // Enrich book data
    const books: Book[] = []

    for (const extractedBook of extractedBooks) {
      // Enrich with metadata from Open Library
      const enrichedData = await enrichBookData(extractedBook.title, extractedBook.author)

      const book: Book = {
        id: uuidv4(),
        title: extractedBook.title,
        author: extractedBook.author,
        cover_url: enrichedData?.cover_url,
        isbn: enrichedData?.isbn,
        publication_year: enrichedData?.publication_year,
        publisher: enrichedData?.publisher,
        description: enrichedData?.description
      }

      books.push(book)
    }

    // Return the books for selection (don't save to database yet)
    return NextResponse.json({
      books,
      message: `Found ${books.length} book${books.length !== 1 ? 's' : ''} in the image`
    })

  } catch (error) {
    console.error('Error processing image for books:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}