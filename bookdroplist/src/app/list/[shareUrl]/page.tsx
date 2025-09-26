'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import BookGrid from '@/components/BookGrid'
import ShareButton from '@/components/ShareButton'
import FavoriteButton from '@/components/FavoriteButton'
import PurposeDisplay from '@/components/PurposeDisplay'
import MinimalMap from '@/components/MinimalMap'
import LastUpdated from '@/components/LastUpdated'
import type { BookList } from '@/types'

export default function ListPage() {
  const params = useParams()
  const shareUrl = params.shareUrl as string
  const [bookList, setBookList] = useState<BookList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    try {
      const response = await fetch(`/api/lists/${shareUrl}`)
      if (!response.ok) {
        throw new Error('List not found')
      }
      const data = await response.json()
      setBookList(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load list')
    } finally {
      setLoading(false)
    }
  }, [shareUrl])

  useEffect(() => {
    fetchList()
  }, [fetchList])



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
      </div>
    )
  }

  if (error || !bookList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'List not found'}
          </h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Create a new list
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <nav className="text-sm">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">My Lists</Link>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-gray-500">{bookList.name}</span>
          </nav>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            {bookList.name}
          </h1>
          <p className="text-gray-600 mt-2">
            {bookList.books.length} {bookList.books.length === 1 ? 'book' : 'books'} found
          </p>
        </div>

        {/* Purpose Display */}
        <PurposeDisplay purpose={bookList.purpose} />

        {/* Last Updated Indicator */}
        <LastUpdated updatedAt={bookList.updated_at} purpose={bookList.purpose} />

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <ShareButton shareUrl={shareUrl} />
          <FavoriteButton listId={bookList.id} isOwner={bookList.isOwner || false} />
        </div>

        {/* Minimal Map Display */}
        <MinimalMap
          latitude={bookList.public_latitude}
          longitude={bookList.public_longitude}
          exactLatitude={bookList.exact_latitude}
          exactLongitude={bookList.exact_longitude}
          locationName={bookList.location_name}
          city={bookList.city}
          country={bookList.country}
          purpose={bookList.purpose}
        />

        <BookGrid books={bookList.books} />

        <div className="text-center mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Another List
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              My Lists
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}