import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || 'placeholder-key'
const genAI = new GoogleGenerativeAI(apiKey)

// ISBN validation utilities
export function isValidISBN(isbn: string): boolean {
  const cleanISBN = isbn.replace(/[-\s]/g, '')
  return isValidISBN10(cleanISBN) || isValidISBN13(cleanISBN)
}

function isValidISBN10(isbn: string): boolean {
  if (isbn.length !== 10) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    if (!/\d/.test(isbn[i])) return false
    sum += parseInt(isbn[i]) * (10 - i)
  }

  const checkDigit = isbn[9]
  const expectedCheck = (11 - (sum % 11)) % 11
  return checkDigit === (expectedCheck === 10 ? 'X' : expectedCheck.toString())
}

function isValidISBN13(isbn: string): boolean {
  if (isbn.length !== 13) return false
  if (!/^\d{13}$/.test(isbn)) return false

  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3)
  }

  const checkDigit = parseInt(isbn[12])
  const expectedCheck = (10 - (sum % 10)) % 10
  return checkDigit === expectedCheck
}

export function normalizeISBN(isbn: string): string {
  return isbn.replace(/[-\s]/g, '')
}

export interface ExtractedBook {
  title: string
  author?: string
  publisher?: string
  series?: string
  isbn?: string
  type?: 'spine_text' | 'isbn_code'
}

export async function extractBooksFromImage(imageFile: File): Promise<ExtractedBook[]> {
  try {
    // Check if API key is available
    if (!apiKey || apiKey === 'placeholder-key') {
      throw new Error('Gemini API key is not configured')
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const prompt = `
      Analyze this image and extract book information from:
      1. Book spines, covers, or visible text
      2. ISBN codes or barcodes (if present)
      3. Publisher information when no clear author is visible

      For each book, extract as much information as possible:

      Return a JSON array of objects with available fields:
      - title: the book title (required, clean without extra formatting)
      - author: author name (optional, clean without extra formatting)
      - publisher: publisher name (optional, especially for travel guides, art books, etc.)
      - series: book series name (optional, e.g., "Lonely Planet", "Rick Steves")
      - isbn: ISBN code if visible (optional, clean numbers only)
      - type: "spine_text" for books read from covers/spines, "isbn_code" for ISBN detection

      Include books if you can identify:
      - Title + Author (traditional books)
      - Title + Publisher (travel guides, coffee table books, reference books)
      - Valid ISBN code (even if title/author unclear)

      Examples:
      [
        {"title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "type": "spine_text"},
        {"title": "Rome Travel Guide", "publisher": "Lonely Planet", "series": "Lonely Planet", "type": "spine_text"},
        {"title": "Unknown Title", "isbn": "9781234567890", "type": "isbn_code"}
      ]

      Return only the JSON array, no additional text.
    `

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: imageFile.type
        }
      }
    ])

    const response = await result.response
    const text = response.text()

    // Clean the response to extract JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const books = JSON.parse(jsonMatch[0]) as ExtractedBook[]

    // Filter and validate books
    return books.filter(book => {
      // Must have a title
      if (!book.title) return false

      // For ISBN detection, validate the ISBN
      if (book.isbn) {
        const cleanISBN = normalizeISBN(book.isbn)
        if (!isValidISBN(cleanISBN)) {
          // Invalid ISBN, but keep if has other identifiers
          book.isbn = undefined
        } else {
          book.isbn = cleanISBN
        }
      }

      // Accept books with:
      // 1. Title + Author (traditional)
      // 2. Title + Publisher (travel guides, etc.)
      // 3. Valid ISBN (even without clear title/author)
      return book.author || book.publisher || book.isbn
    })
  } catch (error) {
    console.error('Error extracting books from image:', error)
    throw new Error('Failed to extract books from image')
  }
}