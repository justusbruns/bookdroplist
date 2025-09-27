import { NextRequest, NextResponse } from 'next/server'
import { extractBooksFromImage } from '@/lib/gemini'
import { requireAuth } from '@/lib/session'
import { v4 as uuidv4 } from 'uuid'
import type { Book } from '@/types'

interface GoogleBookImageLinks {
  thumbnail?: string;
  smallThumbnail?: string;
}

interface GoogleBookIndustryIdentifier {
  type: 'ISBN_13' | 'ISBN_10';
  identifier: string;
}

interface GoogleBookVolumeInfo {
  title: string;
  authors: string[];
  imageLinks?: GoogleBookImageLinks;
  industryIdentifiers?: GoogleBookIndustryIdentifier[];
  publishedDate?: string;
  publisher?: string;
  description?: string;
}

interface GoogleBookItem {
  volumeInfo: GoogleBookVolumeInfo;
}

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
  publisher?: string[];
}

interface EnhancedBook extends Book {
  source: 'google_books' | 'open_library';
  searchStrategy: 'original' | 'normalized' | 'quoted';
  relevanceScore: number;
  openlibrary_key?: string;
}

// Helper function to remove curl effect from Google Books cover URLs
function cleanGoogleBooksUrl(url: string): string {
  if (!url) return url
  return url.replace(/&edge=curl/, '')
}

// Helper function to normalize search queries for better matching
function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/^(the|de|la|le|el|das|der|die)\s+/i, '') // Remove articles
    .trim()
}

// Helper function to normalize titles for deduplication
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

// Search Google Books API with multiple query strategies
async function searchGoogleBooks(query: string): Promise<EnhancedBook[]> {
  try {
    const normalizedQuery = normalizeSearchQuery(query)
    const quotedQuery = `"${query.trim().split(' ').slice(0, 2).join(' ')}"${query.trim().split(' ').slice(2).join(' ') ? ' ' + query.trim().split(' ').slice(2).join(' ') : ''}`

    // Build search URLs for different strategies
    const searchUrls = [
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3`,
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(normalizedQuery)}&maxResults=3`,
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(quotedQuery)}&maxResults=3`
    ]

    // Execute all searches in parallel
    const responses = await Promise.allSettled(
      searchUrls.map(url => fetch(url))
    )

    const allResults: EnhancedBook[] = []

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i]
      if (response.status === 'fulfilled' && response.value.ok) {
        try {
          const data = await response.value.json()
          if (data.items) {
            const books: EnhancedBook[] = data.items.map((item: GoogleBookItem) => {
              const volumeInfo = item.volumeInfo
              return {
                id: uuidv4(),
                title: volumeInfo.title || 'Unknown Title',
                author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author',
                cover_url: (volumeInfo.imageLinks?.thumbnail ? cleanGoogleBooksUrl(volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')) : null) ||
                           (volumeInfo.imageLinks?.smallThumbnail ? cleanGoogleBooksUrl(volumeInfo.imageLinks.smallThumbnail.replace('http:', 'https:')) : null),
                isbn: volumeInfo.industryIdentifiers?.find((id: GoogleBookIndustryIdentifier) =>
                  id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier,
                publication_year: volumeInfo.publishedDate ?
                  parseInt(volumeInfo.publishedDate.split('-')[0]) : undefined,
                publisher: volumeInfo.publisher,
                description: volumeInfo.description,
                source: 'google_books',
                searchStrategy: i === 0 ? 'original' : i === 1 ? 'normalized' : 'quoted',
                relevanceScore: i === 0 ? 3 : i === 2 ? 2 : 1 // Prefer original, then quoted, then normalized
              }
            })
            allResults.push(...books)
          }
        } catch (parseError) {
          console.warn(`Failed to parse response from search strategy ${i}:`, parseError)
        }
      }
    }

    return allResults.filter((book: EnhancedBook) =>
      book.title &&
      book.title !== 'Unknown Title' &&
      book.title.length > 1 &&
      book.author !== 'Unknown Author'
    )
  } catch (error) {
    console.error('Google Books search error:', error)
    return []
  }
}

// Search Open Library API (fallback) with multiple query strategies
async function searchOpenLibrary(query: string): Promise<EnhancedBook[]> {
  try {
    const normalizedQuery = normalizeSearchQuery(query)
    const quotedQuery = `"${query.trim().split(' ').slice(0, 2).join(' ')}"${query.trim().split(' ').slice(2).join(' ') ? ' ' + query.trim().split(' ').slice(2).join(' ') : ''}`

    // Build search URLs for different strategies
    const searchUrls = [
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3&fields=key,title,author_name,cover_i,first_publish_year,isbn,publisher`,
      `https://openlibrary.org/search.json?q=${encodeURIComponent(normalizedQuery)}&limit=3&fields=key,title,author_name,cover_i,first_publish_year,isbn,publisher`,
      `https://openlibrary.org/search.json?q=${encodeURIComponent(quotedQuery)}&limit=3&fields=key,title,author_name,cover_i,first_publish_year,isbn,publisher`
    ]

    // Execute all searches in parallel
    const responses = await Promise.allSettled(
      searchUrls.map(url => fetch(url))
    )

    const allResults: EnhancedBook[] = []

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i]
      if (response.status === 'fulfilled' && response.value.ok) {
        try {
          const data = await response.value.json()
          if (data.docs) {
            const books: EnhancedBook[] = data.docs.map((doc: OpenLibraryDoc) => ({
              id: uuidv4(),
              title: doc.title || 'Unknown Title',
              author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
              cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
              isbn: doc.isbn ? doc.isbn[0] : undefined,
              publication_year: doc.first_publish_year || undefined,
              publisher: doc.publisher ? doc.publisher.join(', ') : undefined,
              description: undefined,
              openlibrary_key: doc.key,
              source: 'open_library',
              searchStrategy: i === 0 ? 'original' : i === 1 ? 'normalized' : 'quoted',
              relevanceScore: i === 0 ? 3 : i === 2 ? 2 : 1 // Prefer original, then quoted, then normalized
            }))
            allResults.push(...books)
          }
        } catch (parseError) {
          console.warn(`Failed to parse Open Library response from search strategy ${i}:`, parseError)
        }
      }
    }

    return allResults.filter((book: EnhancedBook) =>
      book.title &&
      book.title !== 'Unknown Title' &&
      book.title.length > 1 &&
      book.author !== 'Unknown Author'
    )
  } catch (error) {
    console.error('Open Library search error:', error)
    return []
  }
}

// Deduplicate results from multiple sources with enhanced prioritization
function deduplicateBooks(books: EnhancedBook[]): EnhancedBook[] {
  const seen = new Map<string, EnhancedBook>()

  for (const book of books) {
    // Create a key for deduplication based on normalized title and author
    const key = `${normalizeTitle(book.title)}_${(book.author || '').toLowerCase()}`

    if (!seen.has(key)) {
      seen.set(key, book)
    } else {
      // If we have a duplicate, prefer the one with better data based on multiple criteria
      const existing = seen.get(key) as EnhancedBook

      // Calculate preference score
      const bookScore = calculateBookPreference(book)
      const existingScore = calculateBookPreference(existing)

      if (bookScore > existingScore) {
        seen.set(key, book)
      }
    }
  }

  // Sort results by preference score (highest first)
  return Array.from(seen.values()).sort((a, b) =>
    calculateBookPreference(b) - calculateBookPreference(a)
  )
}

// Calculate preference score for a book result
function calculateBookPreference(book: EnhancedBook): number {
  let score = 0

  // Base score from search strategy relevance
  score += book.relevanceScore || 0

  // Prefer Google Books over Open Library (generally better data)
  if (book.source === 'google_books') score += 2

  // Prefer books with descriptions
  if (book.description) score += 1

  // Prefer books with cover images
  if (book.cover_url) score += 1

  // Prefer books with publication years
  if (book.publication_year) score += 0.5

  // Prefer books with ISBN
  if (book.isbn) score += 0.5

  return score
}

// Enhanced book search function
async function searchForBook(title: string, author: string): Promise<Book> {
  const query = `${title} ${author}`.trim()

  console.log(`Searching for book: "${title}" by "${author}"`)

  // Search multiple APIs in parallel
  const [googleBooks, openLibraryBooks] = await Promise.all([
    searchGoogleBooks(query),
    searchOpenLibrary(query)
  ])

  console.log(`Google Books found: ${googleBooks.length}, Open Library found: ${openLibraryBooks.length}`)

  // Combine and deduplicate results
  const allBooks = [...googleBooks, ...openLibraryBooks]
  const uniqueBooks = deduplicateBooks(allBooks)

  // Return the best match or create a basic book object
  if (uniqueBooks.length > 0) {
    const bestMatch = uniqueBooks[0]
    return {
      id: uuidv4(),
      title: bestMatch.title,
      author: bestMatch.author,
      cover_url: bestMatch.cover_url,
      isbn: bestMatch.isbn,
      publication_year: bestMatch.publication_year,
      publisher: bestMatch.publisher,
      description: bestMatch.description
    }
  }

  // Fallback: return basic book data
  return {
    id: uuidv4(),
    title,
    author,
    cover_url: undefined,
    isbn: undefined,
    publication_year: undefined,
    publisher: undefined,
    description: undefined
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    try {
      await requireAuth()
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Extract books from image using Gemini
    console.log('Processing image with Gemini AI...')
    const extractedBooks = await extractBooksFromImage(file)
    console.log('Extracted books from Gemini:', extractedBooks)

    if (extractedBooks.length === 0) {
      return NextResponse.json({ error: 'No books found in the image' }, { status: 400 })
    }

    // Enrich book data using enhanced search
    const books: Book[] = []

    for (const extractedBook of extractedBooks) {
      // Use enhanced search for better book matching
      const enrichedBook = await searchForBook(extractedBook.title, extractedBook.author || '')
      books.push(enrichedBook)
    }

    // Return the books for selection (don't save to database yet)
    return NextResponse.json({
      books,
      message: `Found ${books.length} book${books.length !== 1 ? 's' : ''} in the image`
    })

  } catch (error) {
    console.error('Error processing image for books:', error)

    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      {
        error: 'Failed to process image',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}