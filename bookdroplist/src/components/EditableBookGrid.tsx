'use client'

import { useState, useEffect } from 'react'
import type { Book } from '@/types'

interface EditableBookGridProps {
  books: Book[]
  onBooksUpdate: (books: Book[]) => void
  isLoading: boolean
  onAddBooksClick?: () => void
}

interface EditingBook extends Book {
  isEditing?: boolean
}

export default function EditableBookGrid({ books, onBooksUpdate, isLoading, onAddBooksClick }: EditableBookGridProps) {
  const [editingBooks, setEditingBooks] = useState<EditingBook[]>(books)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Sync internal state with props when books change
  useEffect(() => {
    setEditingBooks(books)
  }, [books])

  const handleEditToggle = (index: number) => {
    const updatedBooks = [...editingBooks]
    updatedBooks[index] = {
      ...updatedBooks[index],
      isEditing: !updatedBooks[index].isEditing
    }
    setEditingBooks(updatedBooks)
  }

  const handleFieldChange = (index: number, field: keyof Book, value: string | number) => {
    const updatedBooks = [...editingBooks]
    updatedBooks[index] = {
      ...updatedBooks[index],
      [field]: value
    }
    setEditingBooks(updatedBooks)
  }

  const handleSaveBook = (index: number) => {
    const updatedBooks = [...editingBooks]
    updatedBooks[index] = {
      ...updatedBooks[index],
      isEditing: false
    }
    setEditingBooks(updatedBooks)

    // Remove isEditing field before sending to parent
    const cleanBooks = updatedBooks.map(({ isEditing, ...book }) => book)
    onBooksUpdate(cleanBooks)
  }

  const handleRemoveBook = (index: number) => {
    if (confirm('Are you sure you want to remove this book from the list?')) {
      const updatedBooks = editingBooks.filter((_, i) => i !== index)
      setEditingBooks(updatedBooks)

      const cleanBooks = updatedBooks.map(({ isEditing, ...book }) => book)
      onBooksUpdate(cleanBooks)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const updatedBooks = [...editingBooks]
    const draggedBook = updatedBooks[draggedIndex]

    // Remove dragged book from its original position
    updatedBooks.splice(draggedIndex, 1)

    // Insert at new position
    updatedBooks.splice(dropIndex, 0, draggedBook)

    setEditingBooks(updatedBooks)
    setDraggedIndex(null)

    const cleanBooks = updatedBooks.map(({ isEditing, ...book }) => book)
    onBooksUpdate(cleanBooks)
  }

  if (editingBooks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p className="text-gray-500">No books in this list</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 items-end">
      {editingBooks.map((book, index) => (
        <div
          key={book.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          className={`bg-white rounded-b-lg shadow-md overflow-hidden transition-all duration-200 cursor-move ${
            draggedIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-lg'
          } ${isLoading ? 'opacity-60' : ''}`}
        >
          {/* Book Cover */}
          <div className="bg-gray-100 relative flex items-end">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={`Cover of ${book.title}`}
                className="w-full h-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-full aspect-[3/4] flex items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}

            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => handleEditToggle(index)}
                className="bg-black bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-90 transition-colors"
                title="Edit book"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleRemoveBook(index)}
                className="bg-red-600 bg-opacity-90 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                title="Remove book"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Book Details */}
          <div className="p-4 h-24 flex flex-col">
            {book.isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={book.title}
                    onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={book.author}
                    onChange={(e) => handleFieldChange(index, 'author', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cover URL</label>
                  <input
                    type="url"
                    value={book.cover_url || ''}
                    onChange={(e) => handleFieldChange(index, 'cover_url', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveBook(index)}
                    className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleEditToggle(index)}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-gray-600 text-xs mb-2">
                  {book.author}
                </p>
                <div className="mt-auto">
                  {book.publication_year && (
                    <p className="text-gray-500 text-xs">
                      {book.publication_year}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Add Books Card */}
      {onAddBooksClick && (
        <div
          onClick={onAddBooksClick}
          className="bg-white rounded-b-lg shadow-md overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        >
          <div className="aspect-[2/3] bg-gray-50 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium">Add Books</span>
          </div>
          <div className="p-4 text-center">
            <p className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
              Click to add more books to your list
            </p>
          </div>
        </div>
      )}
    </div>
  )
}