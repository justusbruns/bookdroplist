import { NextRequest, NextResponse } from 'next/server'
import { extractBooksFromImage } from '@/lib/gemini'
import { enrichBookData } from '@/lib/openLibrary'
import { requireAuth } from '@/lib/session'
import { v4 as uuidv4 } from 'uuid'
import type { Book } from '@/types'

interface BookChange {
  book: Book
  action: 'add' | 'remove'
  confidence: number
}

function calculateBookSimilarity(book1: Book, book2: Book): number {
  const title1 = book1.title.toLowerCase().trim()
  const title2 = book2.title.toLowerCase().trim()
  const author1 = (book1.author || '').toLowerCase().trim()
  const author2 = (book2.author || '').toLowerCase().trim()

  // Simple similarity check - can be enhanced with better matching algorithms
  const titleMatch = title1.includes(title2) || title2.includes(title1) || title1 === title2
  const authorMatch = author1.includes(author2) || author2.includes(author1) || author1 === author2

  if (titleMatch && authorMatch) return 0.95
  if (titleMatch || authorMatch) return 0.7

  // Check for partial matches
  const titleWords1 = title1.split(' ').filter((w: string) => w.length > 2)
  const titleWords2 = title2.split(' ').filter((w: string) => w.length > 2)
  const titleWordMatches = titleWords1.filter((w: string) => titleWords2.includes(w)).length
  const titleSimilarity = titleWordMatches / Math.max(titleWords1.length, titleWords2.length)

  if (titleSimilarity > 0.5) return titleSimilarity * 0.8

  return 0
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
    const currentBooksData = formData.get('currentBooks') as string

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    if (!currentBooksData) {
      return NextResponse.json({ error: 'Current books data required' }, { status: 400 })
    }

    const currentBooks: Book[] = JSON.parse(currentBooksData)

    // Extract books from image using Gemini
    const extractedBooks = await extractBooksFromImage(file)
    console.log('Extracted books from image:', extractedBooks)

    // Enrich detected books
    const detectedBooks: Book[] = []
    for (const extractedBook of extractedBooks) {
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

      detectedBooks.push(book)
    }

    // Calculate changes
    const changes: BookChange[] = []

    // Find books to add (detected in image but not in current list)
    for (const detectedBook of detectedBooks) {
      const bestMatch = currentBooks.reduce((best: { book: Book | null, similarity: number }, currentBook) => {
        const similarity = calculateBookSimilarity(detectedBook, currentBook)
        return similarity > best.similarity ? { book: currentBook, similarity } : best
      }, { book: null, similarity: 0 })

      // If no good match found, this is a new book
      if (bestMatch.similarity < 0.6) {
        changes.push({
          book: detectedBook,
          action: 'add',
          confidence: 0.8 // Base confidence for new books
        })
      }
    }

    // Find books to remove (in current list but not detected in image)
    for (const currentBook of currentBooks) {
      const bestMatch = detectedBooks.reduce((best: { book: Book | null, similarity: number }, detectedBook) => {
        const similarity = calculateBookSimilarity(detectedBook, currentBook)
        return similarity > best.similarity ? { book: detectedBook, similarity } : best
      }, { book: null, similarity: 0 })

      // If no good match found, this book might have been removed
      if (bestMatch.similarity < 0.6) {
        changes.push({
          book: currentBook,
          action: 'remove',
          confidence: 0.6 // Lower confidence for removals since they might be hidden
        })
      }
    }

    return NextResponse.json({
      changes,
      detectedBooks: detectedBooks.length,
      currentBooks: currentBooks.length,
      message: `Detected ${changes.length} potential changes`
    })

  } catch (error) {
    console.error('Error detecting mini library changes:', error)
    return NextResponse.json(
      { error: 'Failed to detect changes' },
      { status: 500 }
    )
  }
}