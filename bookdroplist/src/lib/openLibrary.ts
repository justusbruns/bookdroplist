import type { Book } from '@/types'

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
      return {
        cover_url: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined,
        publication_year: book.first_publish_year,
        isbn: book.isbn?.[0],
        publisher: book.publisher?.[0],
        genre: book.subject?.[0]
      }
    }

    const book = searchData.docs[0]

    // Get additional details if we have a work ID
    let description: string | undefined

    return {
      cover_url: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined,
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

export async function getBookCover(title: string, author: string): Promise<string | null> {
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
    console.error('Error getting book cover:', error)
    return null
  }
}