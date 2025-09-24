'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

interface ManualBookEntryProps {
  onCancel: () => void
}

export default function ManualBookEntry({ onCancel }: ManualBookEntryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Book[]>([])
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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

  const addBook = (book: Book) => {
    if (!selectedBooks.find(b => b.id === book.id)) {
      setSelectedBooks(prev => [...prev, book])
      setSearchQuery('')
      setSearchResults([])
      setError(null)
    }
  }

  const removeBook = (bookId: string) => {
    setSelectedBooks(prev => prev.filter(b => b.id !== bookId))
  }

  const createList = async () => {
    if (selectedBooks.length === 0) {
      setError('Please add at least one book to create a list')
      return
    }

    if (isCreating) {
      return // Prevent double-clicks
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/create-manual-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ books: selectedBooks }),
      })

      if (!response.ok) {
        let errorMsg = 'Failed to create list'
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMsg = errorData.error
          }
        } catch (e) {
          // Response might not be JSON, proceed with default message
        }

        if (response.status === 429) {
          throw new Error('Please wait a moment before creating another list')
        }
        throw new Error(errorMsg)
      }

      const { shareUrl } = await response.json()
      router.push(`/list/${shareUrl}`)
    } catch (err) {
      console.error('Error creating list:', err)
      setError('Failed to create list. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Create Book List Manually
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Book Search */}
      <div className="space-y-4 mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for books by title or author..."
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
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Try: "The Great Gatsby", "Stephen King", "1984", "Harry Potter"
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
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
                  onClick={() => addBook(book)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add
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
            Selected Books ({selectedBooks.length})
          </h3>
          <div className="space-y-2">
            {selectedBooks.map((book) => (
              <div key={book.id} className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
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
                  onClick={() => removeBook(book.id)}
                  className="text-red-600 hover:text-red-700"
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
          onClick={createList}
          disabled={selectedBooks.length === 0 || isCreating}
          className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating List...
            </>
          ) : (
            `Create List (${selectedBooks.length} books)`
          )}
        </button>
      </div>
    </div>
  )
}