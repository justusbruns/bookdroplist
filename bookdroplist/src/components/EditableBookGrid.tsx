'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { Book } from '@/types'
import GeneratedBookCover from './GeneratedBookCover'

interface EditableBookGridProps {
  books: Book[]
  onBooksUpdate: (books: Book[]) => void
  isLoading: boolean
  onAddBooksClick?: () => void
}

export default function EditableBookGrid({ books, onBooksUpdate, isLoading, onAddBooksClick }: EditableBookGridProps) {
  const [editingBooks, setEditingBooks] = useState<Book[]>(books)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Sync internal state with props when books change
  useEffect(() => {
    setEditingBooks(books)
  }, [books])


  const handleRemoveBook = (index: number) => {
    if (confirm('Are you sure you want to remove this book from the list?')) {
      const updatedBooks = editingBooks.filter((_, i) => i !== index)
      setEditingBooks(updatedBooks)

      const cleanBooks = updatedBooks
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

    const cleanBooks = updatedBooks
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 md:gap-12 items-end">
      {editingBooks.map((book, index) => (
        <div
          key={book.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          className={`group cursor-move transition-all duration-200 book-perspective ${
            draggedIndex === index ? 'opacity-50 scale-95' : ''
          } ${isLoading ? 'opacity-60' : ''}`}
        >
          {/* Book Cover with Realistic Effect */}
          <div className="relative mb-6">
            <div className="realistic-book-cover">
              {book.cover_url ? (
                <Image
                  src={book.cover_url}
                  alt={`Cover of ${book.title}`}
                  className="w-full h-auto object-cover"
                  width={200}
                  height={300}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    // Show generated cover when image fails to load
                    const generatedCover = e.currentTarget.nextSibling as HTMLElement
                    if (generatedCover) {
                      generatedCover.style.display = 'block'
                    }
                  }}
                />
              ) : null}

              {/* Generated cover - shown when no cover_url or image fails */}
              <div className={book.cover_url ? 'hidden w-full h-full' : 'w-full h-full'}>
                <GeneratedBookCover book={book} />
              </div>

              {/* Remove Button - positioned absolutely over the book cover */}
              <button
                onClick={() => handleRemoveBook(index)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg z-30"
                title="Remove book"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Book Details - Below the cover */}
          <div className="text-center px-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
              {book.title}
            </h3>
            <p className="text-gray-600 text-xs">
              {book.author && book.author !== 'Unknown'
                ? `by ${book.author}`
                : book.publisher
                  ? `Published by ${book.publisher}`
                  : 'Unknown Author'
              }
            </p>
          </div>
        </div>
      ))}

      {/* Add Books Card */}
      {onAddBooksClick && (
        <div className="group cursor-pointer book-perspective">
          {/* Add Books Cover with Green Design */}
          <div className="relative mb-6">
            <div
              onClick={onAddBooksClick}
              className="add-book-card aspect-[2/3]"
            >
              <span className="plus-icon">+</span>
            </div>
          </div>

          {/* Add Books Details */}
          <div className="text-center px-1">
            <p className="text-gray-600 text-xs">
              Click to add more books
            </p>
          </div>
        </div>
      )}
    </div>
  )
}