'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import type { Book } from '@/types'
import BookRating from './BookRating'
import GeneratedBookCover from './GeneratedBookCover'

interface BookDetailModalProps {
  book: Book
  isOpen: boolean
  onClose: () => void
}

export default function BookDetailModal({ book, isOpen, onClose }: BookDetailModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const hasRating = book.average_rating && book.ratings_count
  const hasPageCount = book.page_count
  const hasDescription = book.description && book.description.trim().length > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header with close button */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 pr-8">
                {book.title}
              </h2>
              {book.author && (
                <p className="text-lg text-gray-600 mt-1">
                  {book.author.startsWith('Published by') ? book.author : `by ${book.author}`}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold flex-shrink-0"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Main content */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Book cover */}
            <div className="md:col-span-1">
              <div className="realistic-book-cover max-w-xs mx-auto">
                {book.cover_url ? (
                  <Image
                    src={book.cover_url}
                    alt={`Cover of ${book.title}`}
                    className="w-full object-cover rounded-lg shadow-lg"
                    width={300}
                    height={450}
                    style={{ height: 'auto' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
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
              </div>
            </div>

            {/* Book details */}
            <div className="md:col-span-2 space-y-6">
              {/* Rating and page count */}
              {(hasRating || hasPageCount) && (
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {hasRating && (
                    <BookRating
                      rating={book.average_rating}
                      count={book.ratings_count}
                    />
                  )}
                  {hasPageCount && (
                    <span className="text-gray-600">
                      {book.page_count} pages
                    </span>
                  )}
                </div>
              )}

              {/* Synopsis */}
              {hasDescription && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Synopsis
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    {book.description && book.description.length > 500 ? (
                      <details className="group">
                        <summary className="cursor-pointer">
                          <span>{book.description.substring(0, 500)}...</span>
                          <span className="text-blue-600 hover:text-blue-800 ml-1 group-open:hidden">
                            Read more
                          </span>
                        </summary>
                        <span className="mt-2 block">{book.description.substring(500)}</span>
                      </details>
                    ) : (
                      <p>{book.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Details
                </h3>
                <div className="space-y-2 text-sm">
                  {book.publication_year && (
                    <div className="flex">
                      <span className="font-medium text-gray-600 w-20">Published:</span>
                      <span className="text-gray-700">
                        {book.publication_year}
                        {book.publisher && ` by ${book.publisher}`}
                      </span>
                    </div>
                  )}

                  {(book.genre || (book.categories && book.categories.length > 0)) && (
                    <div className="flex">
                      <span className="font-medium text-gray-600 w-20">Genre:</span>
                      <span className="text-gray-700">
                        {book.categories && book.categories.length > 0
                          ? book.categories.join(', ')
                          : book.genre
                        }
                      </span>
                    </div>
                  )}

                  {book.isbn && (
                    <div className="flex">
                      <span className="font-medium text-gray-600 w-20">ISBN:</span>
                      <span className="text-gray-700 font-mono">{book.isbn}</span>
                    </div>
                  )}

                  {book.language && (
                    <div className="flex">
                      <span className="font-medium text-gray-600 w-20">Language:</span>
                      <span className="text-gray-700 capitalize">{book.language}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}