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
  position?: string
  confidence?: number
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
      Analyze this image to extract book information using this precise methodology:

      STEP 1: INITIAL HORIZONTAL SCAN
      - Scan left to right across the entire image
      - For each book spine or cover you see, record its approximate position (left, center, right)
      - Note orientation: vertical spine, horizontal book, angled book
      - Create a mental list of distinct book positions
      - Count total number of separate books visible

      STEP 2: INITIAL VERTICAL SCAN
      - Scan top to bottom across the entire image
      - Look for any books you missed in horizontal scan
      - Pay attention to books that might be stacked, rotated, or partially hidden
      - Check for books in unusual orientations
      - Update your count of total books

      STEP 3: CROSS-VERIFICATION
      - Compare results from Step 1 and Step 2
      - If the book counts differ significantly (more than 1-2 books), START OVER from Step 1
      - Ensure you have identified the same books in both scans
      - Create a verified list of book positions before proceeding

      STEP 4: DETAILED TEXT EXTRACTION (for each verified book position)
      For each book location identified in Steps 1-3:
      - Focus ONLY on that specific book position
      - Extract title (usually the largest text on spine/cover)
      - Extract author (often smaller text, may include "by" prefix)
      - Extract publisher (commonly at bottom of spine or corner of cover)
      - Extract series name (like "Lonely Planet", "Rick Steves", "DK Eyewitness")
      - Look for ISBN (13-digit number, often near barcode)
      - Note book type: spine_text or isbn_code

      STEP 5: DATA INTEGRITY CHECK
      For each extracted book:
      - Verify all information comes from the SAME book position
      - Do NOT combine title from one book with author from another book
      - If uncertain about any detail, mark it as unknown rather than guess
      - Check ISBN format: must be exactly 10 or 13 digits

      STEP 6: FINAL VALIDATION
      - Review your list against the original image one more time
      - Ensure book count matches what you can clearly see
      - Remove any entries where you mixed data between books
      - Keep only books where you are confident about the information

      OUTPUT REQUIREMENTS:
      Return a JSON array with these exact fields:
      - title: book title (required, no extra formatting)
      - author: author name (optional, remove "by" prefix if present)
      - publisher: publisher name (optional, crucial for travel/art books)
      - series: series name (optional, e.g., "Lonely Planet")
      - isbn: ISBN digits only (optional, no dashes/spaces)
      - type: "spine_text" or "isbn_code"
      - position: approximate location "left"|"center"|"right" (for verification)
      - confidence: your confidence level 0.1-1.0

      CRITICAL RULES:
      1. Each JSON object = exactly ONE physical book
      2. Never mix information between different books
      3. Include only books you can clearly identify
      4. Better to have fewer accurate entries than many inaccurate ones
      5. If scan results don't align in Step 3, restart the process

      EXAMPLE OUTPUT:
      [
        {"title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "type": "spine_text", "position": "left", "confidence": 0.9},
        {"title": "Rome", "publisher": "Lonely Planet", "series": "Lonely Planet", "type": "spine_text", "position": "center", "confidence": 0.8},
        {"title": "Art History", "publisher": "Taschen", "type": "spine_text", "position": "right", "confidence": 0.7}
      ]

      Return ONLY the JSON array.
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