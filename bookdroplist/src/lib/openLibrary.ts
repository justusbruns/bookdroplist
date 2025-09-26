import type { Book } from '@/types'

// Helper function to remove curl effect from Google Books cover URLs
function cleanGoogleBooksUrl(url: string): string {
  if (!url) return url
  return url.replace(/&edge=curl/, '')
}

interface OpenLibrarySearchResult {
  docs: {
    title: string
    author_name?: string[]
    cover_i?: number
    first_publish_year?: number
    isbn?: string[]
    publisher?: string[]
    subject?: string[]
  }[]
}

export async function enrichBookData(title: string, author: string): Promise<Partial<Book>> {
  try {
    // Search for the book using title and author
    const searchQuery = `title:"${title}" author:"${author}"`
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=1`

    const searchResponse = await fetch(searchUrl)
    const searchData: OpenLibrarySearchResult = await searchResponse.json()

    if (searchData.docs.length === 0) {
      // Fallback: search with just title
      const titleOnlyUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`
      const titleResponse = await fetch(titleOnlyUrl)
      const titleData: OpenLibrarySearchResult = await titleResponse.json()

      if (titleData.docs.length === 0) {
        return {}
      }

      const book = titleData.docs[0]
      const coverUrl = await getBookCover(title, author, book.isbn?.[0])

      return {
        cover_url: coverUrl || (book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined),
        publication_year: book.first_publish_year,
        isbn: book.isbn?.[0],
        publisher: book.publisher?.[0],
        genre: book.subject?.[0]
      }
    }

    const book = searchData.docs[0]

    // Get additional details if we have a work ID
    let description: string | undefined

    const coverUrl = await getBookCover(title, author, book.isbn?.[0])

    return {
      cover_url: coverUrl || (book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined),
      publication_year: book.first_publish_year,
      isbn: book.isbn?.[0],
      publisher: book.publisher?.[0],
      genre: book.subject?.[0],
      description
    }
  } catch (error) {
    console.error('Error enriching book data:', error)
    return {}
  }
}

// High-quality book cover API using Goodreads
async function getBookCoverFromGoodreads(title: string, author: string): Promise<string | null> {
  try {
    const url = `https://bookcover.longitood.com/bookcover?book_title=${encodeURIComponent(title)}&author_name=${encodeURIComponent(author)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BookDropList/1.0'
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.url && data.url !== 'N/A') {
        return data.url
      }
    }
  } catch (error) {
    console.error('Error getting book cover from Goodreads API:', error)
  }
  return null
}

// Google Books API for book covers
async function getBookCoverFromGoogle(title: string, author: string, isbn?: string): Promise<string | null> {
  try {
    let searchQuery = `intitle:"${title}"`
    if (author) {
      searchQuery += ` inauthor:"${author}"`
    }

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=1`

    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo
        if (book.imageLinks) {
          // Try to get the highest quality image available
          const coverUrl = book.imageLinks.extraLarge ||
                          book.imageLinks.large ||
                          book.imageLinks.medium ||
                          book.imageLinks.thumbnail || null
          return cleanGoogleBooksUrl(coverUrl)
        }
      }
    }

    // If we have ISBN, try direct lookup
    if (isbn) {
      const isbnUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      const isbnResponse = await fetch(isbnUrl)
      if (isbnResponse.ok) {
        const isbnData = await isbnResponse.json()
        if (isbnData.items && isbnData.items.length > 0) {
          const book = isbnData.items[0].volumeInfo
          if (book.imageLinks) {
            const coverUrl = book.imageLinks.extraLarge ||
                            book.imageLinks.large ||
                            book.imageLinks.medium ||
                            book.imageLinks.thumbnail || null
            return cleanGoogleBooksUrl(coverUrl)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error getting book cover from Google Books:', error)
  }
  return null
}

// OpenLibrary fallback
async function getBookCoverFromOpenLibrary(title: string, author: string): Promise<string | null> {
  try {
    const searchQuery = `title:"${title}" author:"${author}"`
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=1`

    const response = await fetch(searchUrl)
    const data: OpenLibrarySearchResult = await response.json()

    if (data.docs.length > 0 && data.docs[0].cover_i) {
      return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`
    }

    return null
  } catch (error) {
    console.error('Error getting book cover from OpenLibrary:', error)
    return null
  }
}

export async function getBookCover(title: string, author: string, isbn?: string): Promise<string | null> {
  // Try multiple sources in order of quality preference

  // 1. Try Bookcover API (uses Goodreads - highest quality)
  const goodreadsCover = await getBookCoverFromGoodreads(title, author)
  if (goodreadsCover) {
    return goodreadsCover
  }

  // 2. Try Google Books API (good quality, high availability)
  const googleCover = await getBookCoverFromGoogle(title, author, isbn)
  if (googleCover) {
    return googleCover
  }

  // 3. Fallback to OpenLibrary (lower quality but better than nothing)
  const openLibraryCover = await getBookCoverFromOpenLibrary(title, author)
  if (openLibraryCover) {
    return openLibraryCover
  }

  return null
}