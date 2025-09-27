import type { Book } from '@/types'

interface GoogleBooksVolumeInfo {
  title: string
  authors?: string[]
  publisher?: string
  publishedDate?: string
  industryIdentifiers?: Array<{
    type: string
    identifier: string
  }>
  imageLinks?: {
    thumbnail?: string
    small?: string
    medium?: string
    large?: string
    extraLarge?: string
  }
  description?: string
  categories?: string[]
  // Enhanced metadata
  averageRating?: number
  ratingsCount?: number
  pageCount?: number
  language?: string
  maturityRating?: string
}

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

// Direct ISBN lookup for instant book identification
export async function getBookByISBN(isbn: string): Promise<Partial<Book> | null> {
  try {
    // Clean the ISBN
    const cleanISBN = isbn.replace(/[-\s]/g, '')

    // Try Google Books API first (most comprehensive)
    const googleResult = await getBookFromGoogleByISBN(cleanISBN)
    if (googleResult) return googleResult

    // Fallback to OpenLibrary
    const openLibraryResult = await getBookFromOpenLibraryByISBN(cleanISBN)
    if (openLibraryResult) return openLibraryResult

    return null
  } catch (error) {
    console.error('Error getting book by ISBN:', error)
    return null
  }
}

async function getBookFromGoogleByISBN(isbn: string): Promise<Partial<Book> | null> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    const response = await fetch(url)

    if (!response.ok) return null

    const data = await response.json()
    if (!data.items || data.items.length === 0) return null

    const volumeInfo: GoogleBooksVolumeInfo = data.items[0].volumeInfo

    return {
      title: volumeInfo.title,
      author: volumeInfo.authors?.[0] || 'Unknown Author',
      publisher: volumeInfo.publisher,
      publication_year: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate.substring(0, 4)) : undefined,
      isbn: isbn,
      description: volumeInfo.description,
      genre: volumeInfo.categories?.[0],
      cover_url: volumeInfo.imageLinks ? cleanGoogleBooksUrl(
        volumeInfo.imageLinks?.extraLarge ||
        volumeInfo.imageLinks?.large ||
        volumeInfo.imageLinks?.medium ||
        volumeInfo.imageLinks?.thumbnail ||
        ''
      ) : undefined,
      // Enhanced metadata
      average_rating: volumeInfo.averageRating,
      ratings_count: volumeInfo.ratingsCount,
      page_count: volumeInfo.pageCount,
      language: volumeInfo.language,
      categories: volumeInfo.categories,
      maturity_rating: volumeInfo.maturityRating
    }
  } catch (error) {
    console.error('Error fetching from Google Books by ISBN:', error)
    return null
  }
}

async function getBookFromOpenLibraryByISBN(isbn: string): Promise<Partial<Book> | null> {
  try {
    const url = `https://openlibrary.org/search.json?isbn=${isbn}&limit=1`
    const response = await fetch(url)

    if (!response.ok) return null

    const data: OpenLibrarySearchResult = await response.json()
    if (!data.docs || data.docs.length === 0) return null

    const book = data.docs[0]

    return {
      title: book.title,
      author: book.author_name?.[0] || 'Unknown Author',
      publisher: book.publisher?.[0],
      publication_year: book.first_publish_year,
      isbn: isbn,
      genre: book.subject?.[0],
      cover_url: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined
    }
  } catch (error) {
    console.error('Error fetching from OpenLibrary by ISBN:', error)
    return null
  }
}

// Enhanced Google Books search that returns full metadata including ratings
export async function getEnhancedMetadataFromGoogle(title: string, author?: string, isbn?: string): Promise<Partial<Book>> {
  try {
    let searchQuery = `intitle:"${title}"`
    if (author) {
      searchQuery += ` inauthor:"${author}"`
    }

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=1`
    const response = await fetch(url)

    if (!response.ok) return {}

    const data = await response.json()
    if (!data.items || data.items.length === 0) {
      // Try with ISBN if available
      if (isbn) {
        const isbnUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
        const isbnResponse = await fetch(isbnUrl)
        if (isbnResponse.ok) {
          const isbnData = await isbnResponse.json()
          if (isbnData.items && isbnData.items.length > 0) {
            const volumeInfo: GoogleBooksVolumeInfo = isbnData.items[0].volumeInfo
            return {
              description: volumeInfo.description,
              average_rating: volumeInfo.averageRating,
              ratings_count: volumeInfo.ratingsCount,
              page_count: volumeInfo.pageCount,
              language: volumeInfo.language,
              categories: volumeInfo.categories,
              maturity_rating: volumeInfo.maturityRating,
              cover_url: volumeInfo.imageLinks ? cleanGoogleBooksUrl(
                volumeInfo.imageLinks?.extraLarge ||
                volumeInfo.imageLinks?.large ||
                volumeInfo.imageLinks?.medium ||
                volumeInfo.imageLinks?.thumbnail ||
                ''
              ) : undefined
            }
          }
        }
      }
      return {}
    }

    const volumeInfo: GoogleBooksVolumeInfo = data.items[0].volumeInfo
    return {
      description: volumeInfo.description,
      average_rating: volumeInfo.averageRating,
      ratings_count: volumeInfo.ratingsCount,
      page_count: volumeInfo.pageCount,
      language: volumeInfo.language,
      categories: volumeInfo.categories,
      maturity_rating: volumeInfo.maturityRating,
      cover_url: volumeInfo.imageLinks ? cleanGoogleBooksUrl(
        volumeInfo.imageLinks?.extraLarge ||
        volumeInfo.imageLinks?.large ||
        volumeInfo.imageLinks?.medium ||
        volumeInfo.imageLinks?.thumbnail ||
        ''
      ) : undefined
    }
  } catch (error) {
    console.error('Error getting enhanced metadata from Google Books:', error)
    return {}
  }
}

export async function enrichBookData(title: string, author?: string, publisher?: string, series?: string): Promise<Partial<Book>> {
  try {
    let searchQuery: string
    let fallbackQuery: string

    // Build search query based on available information, prioritizing series for travel guides
    if (series && publisher) {
      // For travel guides with series info, build contextual query
      if (series.toLowerCase().includes('eyewitness')) {
        searchQuery = `"DK Eyewitness ${title} Travel Guide"`
        fallbackQuery = `"${publisher} ${title} travel guide"`
      } else if (series.toLowerCase().includes('lonely planet')) {
        searchQuery = `"Lonely Planet ${title}"`
        fallbackQuery = `"${publisher} ${title}"`
      } else {
        searchQuery = `"${series} ${title}"`
        fallbackQuery = `title:"${title}" publisher:"${publisher}"`
      }
    } else if (author) {
      searchQuery = `title:"${title}" author:"${author}"`
      fallbackQuery = `title:"${title}"`
    } else if (publisher) {
      searchQuery = `title:"${title}" publisher:"${publisher}"`
      fallbackQuery = `title:"${title}"`
    } else {
      searchQuery = `title:"${title}"`
      fallbackQuery = searchQuery
    }

    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=1`
    const searchResponse = await fetch(searchUrl)
    const searchData: OpenLibrarySearchResult = await searchResponse.json()

    if (searchData.docs.length === 0 && searchQuery !== fallbackQuery) {
      // Try fallback search
      const fallbackUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(fallbackQuery)}&limit=1`
      const fallbackResponse = await fetch(fallbackUrl)
      const fallbackData: OpenLibrarySearchResult = await fallbackResponse.json()

      if (fallbackData.docs.length === 0) {
        return {}
      }

      const book = fallbackData.docs[0]
      // For travel guides, use series-aware cover search
      const coverSearchTitle = (series && publisher) ?
        (series.toLowerCase().includes('eyewitness') ? `DK Eyewitness ${title}` :
         series.toLowerCase().includes('lonely planet') ? `Lonely Planet ${title}` :
         `${series} ${title}`) : title
      const coverUrl = await getBookCover(coverSearchTitle, author || book.author_name?.[0] || '', book.isbn?.[0])

      // Get enhanced metadata from Google Books for fallback case
      const enhancedMetadata = await getEnhancedMetadataFromGoogle(
        coverSearchTitle,
        author || book.author_name?.[0],
        book.isbn?.[0]
      )

      return {
        cover_url: enhancedMetadata.cover_url || coverUrl || (book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined),
        publication_year: book.first_publish_year,
        isbn: book.isbn?.[0],
        publisher: publisher || book.publisher?.[0],
        genre: book.subject?.[0],
        // Fill in missing author if found in search results
        ...(author ? {} : { author: book.author_name?.[0] }),
        // Enhanced metadata from Google Books
        description: enhancedMetadata.description,
        average_rating: enhancedMetadata.average_rating,
        ratings_count: enhancedMetadata.ratings_count,
        page_count: enhancedMetadata.page_count,
        language: enhancedMetadata.language,
        categories: enhancedMetadata.categories,
        maturity_rating: enhancedMetadata.maturity_rating
      }
    }

    if (searchData.docs.length === 0) {
      return {}
    }

    const book = searchData.docs[0]
    // For travel guides, use series-aware cover search
    const coverSearchTitle = (series && publisher) ?
      (series.toLowerCase().includes('eyewitness') ? `DK Eyewitness ${title}` :
       series.toLowerCase().includes('lonely planet') ? `Lonely Planet ${title}` :
       `${series} ${title}`) : title
    const coverUrl = await getBookCover(coverSearchTitle, author || book.author_name?.[0] || '', book.isbn?.[0])

    // Get enhanced metadata from Google Books
    const enhancedMetadata = await getEnhancedMetadataFromGoogle(
      coverSearchTitle,
      author || book.author_name?.[0],
      book.isbn?.[0]
    )

    return {
      cover_url: enhancedMetadata.cover_url || coverUrl || (book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined),
      publication_year: book.first_publish_year,
      isbn: book.isbn?.[0],
      publisher: publisher || book.publisher?.[0],
      genre: book.subject?.[0],
      // Fill in missing author if found in search results
      ...(author ? {} : { author: book.author_name?.[0] }),
      // Enhanced metadata from Google Books
      description: enhancedMetadata.description,
      average_rating: enhancedMetadata.average_rating,
      ratings_count: enhancedMetadata.ratings_count,
      page_count: enhancedMetadata.page_count,
      language: enhancedMetadata.language,
      categories: enhancedMetadata.categories,
      maturity_rating: enhancedMetadata.maturity_rating
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