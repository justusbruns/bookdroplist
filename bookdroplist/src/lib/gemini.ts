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
      I need you to carefully analyze this image to extract book information. Follow this systematic approach:

      STEP 1: HORIZONTAL SCAN
      - Look across the image from left to right
      - Identify each individual book spine or cover
      - Note the position and orientation of each book
      - Look for text on spines, covers, and any visible ISBN codes

      STEP 2: VERTICAL SCAN
      - Look up and down the image
      - Check for books in different orientations (some may be rotated)
      - Look for any missed books or text from the horizontal scan
      - Pay special attention to book tops and bottoms

      STEP 3: DETAILED TEXT EXTRACTION
      For each book identified, extract:
      - Title (most prominent text, often largest)
      - Author (usually smaller text, may say "by [name]")
      - Publisher (often at bottom of spine or on cover)
      - Series (like "Lonely Planet", "Rick Steves", etc.)
      - ISBN (13-digit number, often with barcode)

      STEP 4: VERIFICATION
      - Compare your horizontal and vertical scan results
      - Ensure each book is counted only once
      - Double-check that titles, authors, and publishers are not mixed between different books
      - If uncertain about any book's details, include only the information you're confident about

      STEP 5: FINAL CHECK
      - Review each book entry to ensure it represents a single, distinct book
      - Verify no information is accidentally combined from multiple books
      - Confirm ISBN numbers are complete 10 or 13 digit sequences

      OUTPUT FORMAT:
      Return a JSON array with objects containing these fields:
      - title: the book title (required, clean text without extra formatting)
      - author: author name (optional, clean text without "by" prefix)
      - publisher: publisher name (optional, especially important for travel guides, art books)
      - series: book series name (optional, like "Lonely Planet", "Rick Steves")
      - isbn: complete ISBN code if visible (optional, digits only, no dashes)
      - type: "spine_text" for books read from spines/covers, "isbn_code" for ISBN-only detection

      IMPORTANT GUIDELINES:
      - Each JSON object must represent exactly ONE book
      - Do not mix information from different books
      - Include books if you can identify: Title + Author OR Title + Publisher OR Valid ISBN
      - For travel guides and coffee table books, publisher is often more important than author
      - If you can only see an ISBN clearly but not the title, include it as type "isbn_code"

      EXAMPLES:
      [
        {"title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "type": "spine_text"},
        {"title": "Rome", "publisher": "Lonely Planet", "series": "Lonely Planet", "type": "spine_text"},
        {"title": "Van Gogh Paintings", "publisher": "Taschen", "type": "spine_text"},
        {"title": "Unknown Title", "isbn": "9781234567890", "type": "isbn_code"}
      ]

      Return ONLY the JSON array, no additional text or explanation.
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