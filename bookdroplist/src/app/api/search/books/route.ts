import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Use Open Library Search API for book data
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,cover_i,first_publish_year,isbn,publisher`

    const response = await fetch(searchUrl)

    if (!response.ok) {
      throw new Error('Open Library search failed')
    }

    const data = await response.json()

    if (!data.docs || data.docs.length === 0) {
      return NextResponse.json({ books: [] })
    }

    // Transform Open Library results to our book format
    const books = data.docs.map((doc: any) => {
      const book = {
        id: uuidv4(), // Generate a unique ID for our system
        title: doc.title || 'Unknown Title',
        author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
        cover_url: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
        isbn: doc.isbn ? doc.isbn[0] : undefined,
        publication_year: doc.first_publish_year || undefined,
        publisher: doc.publisher ? doc.publisher.join(', ') : undefined,
        description: undefined, // Open Library search doesn't include descriptions
        // Store Open Library key for potential future use
        openlibrary_key: doc.key
      }

      return book
    }).filter((book: any) =>
      // Filter out books with very generic or missing titles
      book.title &&
      book.title !== 'Unknown Title' &&
      book.title.length > 1 &&
      book.author !== 'Unknown Author'
    )

    return NextResponse.json({
      books: books.slice(0, 8), // Limit to 8 results for better UX
      total: data.numFound || 0
    })

  } catch (error) {
    console.error('Error searching books:', error)
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    )
  }
}