'use client'

import { useState } from 'react'
import ImageUpload from '@/components/ImageUpload'

interface Book {
  id: string
  title: string
  author: string
  cover_url?: string
  isbn?: string
  publication_year?: number
  description?: string
  publisher?: string
}

interface AddBooksToListProps {
  listId: string
  shareUrl: string
  onCancel: () => void
  onBooksAdded: (newBooks: Book[]) => void
}

export default function AddBooksToList({ listId, shareUrl, onCancel, onBooksAdded }: AddBooksToListProps) {
  const [addMethod, setAddMethod] = useState<'choose' | 'photo' | 'search'>('choose')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Book[]>([])
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const searchBooks = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a book title or author')
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch('/api/search/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to search for books')
      }

      const results = await response.json()
      setSearchResults(results.books || [])

      if (results.books?.length === 0) {
        setError('No books found. Try a different search term.')
      }
    } catch (err) {
      console.error('Error searching books:', err)
      setError('Failed to search for books. Please try again.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const selectBook = (book: Book) => {
    if (!selectedBooks.find(b => b.id === book.id)) {
      setSelectedBooks(prev => [...prev, book])
    }
  }

  const removeSelectedBook = (bookId: string) => {
    setSelectedBooks(prev => prev.filter(b => b.id !== bookId))
  }

  const addBooksToList = async () => {
    if (selectedBooks.length === 0) {
      setError('Please select at least one book to add')
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      const response = await fetch(`/api/lists/${shareUrl}/add-books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ books: selectedBooks }),
      })

      if (!response.ok) {
        throw new Error('Failed to add books to list')
      }

      const result = await response.json()
      onBooksAdded(result.addedBooks || selectedBooks)

      // Reset form
      setSelectedBooks([])
      setSearchResults([])
      setSearchQuery('')

    } catch (err) {
      console.error('Error adding books to list:', err)
      setError('Failed to add books to list. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleImageUpload = (file: File) => {
    setUploadedImage(file)
    setError(null)
  }

  const processImageForBooks = async () => {
    if (!uploadedImage) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', uploadedImage)

      const response = await fetch('/api/process-image-for-books', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process image')
      }

      const { books } = await response.json()

      if (books && books.length > 0) {
        setSelectedBooks(books)
        setAddMethod('photo')
      } else {
        setError('No books were found in the image. Try a different photo or use manual search.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Add Books to List
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {addMethod === 'choose' && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Photo Upload Option */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer group"
            onClick={() => setAddMethod('photo')}
          >
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Photo</h3>
              <p className="text-sm text-gray-600 mb-4">
                Take a photo of book spines or covers and let AI identify them
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Fast & Automated
              </span>
            </div>
          </div>

          {/* Manual Search Option */}
          <div
            className="border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer group"
            onClick={() => setAddMethod('search')}
          >
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search & Add Books</h3>
              <p className="text-sm text-gray-600 mb-4">
                Search for books by title or author and add them one by one
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Precise Control
              </span>
            </div>
          </div>
        </div>
      )}

      {addMethod === 'photo' && !uploadedImage && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Upload a Photo</h3>
            <button
              onClick={() => setAddMethod('choose')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back to options
            </button>
          </div>
          <ImageUpload onImageUpload={handleImageUpload} />
        </div>
      )}

      {addMethod === 'photo' && uploadedImage && !isProcessing && selectedBooks.length === 0 && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Process Photo</h3>
            <button
              onClick={() => {
                setUploadedImage(null)
                setAddMethod('choose')
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Start over
            </button>
          </div>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">Photo uploaded successfully! Click below to identify the books.</p>
            <button
              onClick={processImageForBooks}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Identify Books in Photo
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="text-center py-12 mb-6">
          <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your photo and identifying books...</p>
        </div>
      )}

      {addMethod === 'search' && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Search for Books</h3>
            <button
              onClick={() => setAddMethod('choose')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back to options
            </button>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for books to add..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && searchBooks()}
              disabled={isSearching}
            />
            <button
              onClick={searchBooks}
              disabled={isSearching || !searchQuery.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && addMethod === 'search' && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Search Results</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((book) => (
              <div key={book.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                {book.cover_url && (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {book.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {book.author}
                  </p>
                  {book.publication_year && (
                    <p className="text-xs text-gray-400">
                      {book.publication_year}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => selectBook(book)}
                  disabled={selectedBooks.some(b => b.id === book.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedBooks.some(b => b.id === book.id) ? 'Selected' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Books */}
      {selectedBooks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Books to Add ({selectedBooks.length})
          </h3>
          <div className="space-y-2">
            {selectedBooks.map((book) => (
              <div key={book.id} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-md">
                {book.cover_url && (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-10 h-14 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {book.title}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {book.author}
                  </p>
                </div>
                <button
                  onClick={() => removeSelectedBook(book.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={addBooksToList}
          disabled={selectedBooks.length === 0 || isAdding}
          className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Adding Books...
            </>
          ) : (
            `Add ${selectedBooks.length} Book${selectedBooks.length !== 1 ? 's' : ''}`
          )}
        </button>
      </div>
    </div>
  )
}