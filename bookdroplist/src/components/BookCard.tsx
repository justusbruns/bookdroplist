'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Book } from '@/types'
import GeneratedBookCover from './GeneratedBookCover'

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
    <div className="group book-perspective">
      {/* Book Cover with Realistic Effect */}
      <div className="relative mb-6">
        <div className="realistic-book-cover">
          {book.cover_url && !imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                </div>
              )}
              <Image
                src={book.cover_url}
                alt={`Cover of ${book.title}`}
                className={`w-full h-auto object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                onError={handleImageError}
                onLoad={handleImageLoad}
                width={200}
                height={300}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </>
          ) : (
            <div className="w-full h-full">
              <GeneratedBookCover book={book} />
            </div>
          )}
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
  )
}