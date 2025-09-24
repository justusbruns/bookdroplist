'use client'

import { useState } from 'react'
import type { Book } from '@/types'

interface BookCardProps {
  book: Book
}

export default function BookCard({ book }: BookCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  return (
    <div className="bg-white rounded-b-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative bg-gray-100 flex items-end">
        {book.cover_url && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
              </div>
            )}
            <img
              src={book.cover_url}
              alt={`Cover of ${book.title}`}
              className={`w-full h-auto object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </>
        ) : (
          <div className="w-full aspect-[2/3] flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600">
            <svg
              className="w-8 h-8 mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-xs text-center font-medium">No Cover</span>
          </div>
        )}
      </div>

      <div className="p-3 min-h-24 flex flex-col">
        <h3 className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-gray-600 mb-2">
          by {book.author}
        </p>

        <div className="mt-auto">
          {(book.publication_year || book.genre) && (
            <div className="flex flex-wrap gap-1 text-xs text-gray-500">
              {book.publication_year && (
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {book.publication_year}
                </span>
              )}
              {book.genre && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {book.genre}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}