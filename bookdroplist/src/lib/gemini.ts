import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || 'placeholder-key'
const genAI = new GoogleGenerativeAI(apiKey)

export interface ExtractedBook {
  title: string
  author: string
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
      Analyze this image and extract all visible book titles and authors from book spines, covers, or any text in the image.

      Return the results as a JSON array of objects, each containing:
      - title: the book title (clean, without extra formatting)
      - author: the author name (clean, without extra formatting)

      Only include books where you can clearly identify both title and author.
      If you can only see a title without an author (or vice versa), skip that book.

      Example format:
      [
        {"title": "The Great Gatsby", "author": "F. Scott Fitzgerald"},
        {"title": "To Kill a Mockingbird", "author": "Harper Lee"}
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
    return books.filter(book => book.title && book.author)
  } catch (error) {
    console.error('Error extracting books from image:', error)
    throw new Error('Failed to extract books from image')
  }
}