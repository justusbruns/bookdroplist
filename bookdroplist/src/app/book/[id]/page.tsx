'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Book } from '@/types'
import BookRating from '@/components/BookRating'
import GeneratedBookCover from '@/components/GeneratedBookCover'

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [referrer, setReferrer] = useState<string>('/dashboard')

  useEffect(() => {
    // Get referrer from sessionStorage or default to dashboard
    const storedReferrer = sessionStorage.getItem('bookDetailReferrer')
    if (storedReferrer) {
      setReferrer(storedReferrer)
    }

    // Fetch book data (for now we'll get it from sessionStorage)
    const storedBook = sessionStorage.getItem('selectedBook')
    if (storedBook) {
      setBook(JSON.parse(storedBook))
    } else {
      // If no book data, redirect back
      router.push(referrer)
    }
    setLoading(false)
  }, [params.id, router, referrer])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Book not found</h1>
          <Link href={referrer} className="text-blue-600 hover:text-blue-700">
            ← Go back
          </Link>
        </div>
      </div>
    )
  }

  const hasRating = book.average_rating && book.ratings_count
  const hasPageCount = book.page_count
  const hasDescription = book.description && book.description.trim().length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href={referrer} className="text-blue-600 hover:text-blue-700 transition-colors">
              ← Back to list
            </Link>
          </div>
        </nav>

        {/* Main Content Card */}
        <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl overflow-hidden p-8 md:p-12 shadow-2xl">

          {/* Responsive Layout: Stacks on mobile, side-by-side on desktop */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-16">

            {/* Book Cover Section with 3D Effect */}
            <div className="flex-shrink-0 w-full md:w-64 flex justify-center">
              <div className="relative transform-style-preserve-3d perspective-1000 group">
                <div className="w-52 md:w-full h-auto rounded-xl shadow-xl object-cover transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={`Cover of ${book.title}`}
                      className="w-full h-auto rounded-xl shadow-xl object-cover"
                      width={300}
                      height={500}
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
            </div>

            {/* Book Details Section */}
            <div className="flex-grow">

              {/* Metadata: Author and Genre */}
              <div className="flex items-center space-x-4 mb-2 text-sm text-blue-600 font-semibold tracking-wide">
                {book.author && (
                  <span className="opacity-80">
                    {book.author.startsWith('Published by') ? book.author : book.author}
                  </span>
                )}
                {book.author && (book.genre || (book.categories && book.categories.length > 0)) && (
                  <span className="text-blue-200">•</span>
                )}
                {(book.genre || (book.categories && book.categories.length > 0)) && (
                  <span className="text-xs uppercase bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    {book.categories && book.categories.length > 0
                      ? book.categories[0]
                      : book.genre
                    }
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4 border-b-4 border-blue-200 pb-2">
                {book.title}
              </h1>

              {/* Rating */}
              {hasRating && (
                <div className="mb-6">
                  <BookRating
                    rating={book.average_rating}
                    count={book.ratings_count}
                    className="text-lg"
                  />
                </div>
              )}

              {/* Synopsis */}
              {hasDescription && (
                <div className="mb-8">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {book.description && book.description.length > 300 ? (
                      <>
                        {book.description.substring(0, 300)}...
                        <details className="inline">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800 ml-1">
                            Read more
                          </summary>
                          <span className="block mt-2">{book.description.substring(300)}</span>
                        </details>
                      </>
                    ) : (
                      book.description
                    )}
                  </p>
                </div>
              )}

              {/* Key Facts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-6 rounded-lg mb-6">

                {/* Pages */}
                {hasPageCount && (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase text-gray-500 mb-1">Pages</span>
                    <span className="text-xl font-bold text-gray-800">{book.page_count}</span>
                  </div>
                )}

                {/* Published */}
                {book.publication_year && (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase text-gray-500 mb-1">Published</span>
                    <span className="text-xl font-bold text-gray-800">{book.publication_year}</span>
                  </div>
                )}

                {/* Publisher */}
                {book.publisher && (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase text-gray-500 mb-1">Publisher</span>
                    <span className="text-xl font-bold text-gray-800">{book.publisher}</span>
                  </div>
                )}

                {/* Language */}
                {book.language && (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase text-gray-500 mb-1">Language</span>
                    <span className="text-xl font-bold text-gray-800 capitalize">{book.language}</span>
                  </div>
                )}

              </div>

              {/* ISBN */}
              {book.isbn && (
                <div className="text-xs text-gray-500 px-1">
                  <span className="font-semibold text-gray-600 mr-1">ISBN:</span>
                  <span className="font-mono">{book.isbn}</span>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}