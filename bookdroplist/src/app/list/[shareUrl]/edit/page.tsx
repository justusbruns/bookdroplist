'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import EditableBookGrid from '@/components/EditableBookGrid'
import LocationCapture from '@/components/LocationCapture'
import AddBooksToList from '@/components/AddBooksToList'
import EditListName from '@/components/EditListName'
import ListPurposeSelector from '@/components/ListPurposeSelector'
import type { BookList, ListPurpose, Book } from '@/types'

export default function EditListPage() {
  const params = useParams()
  const router = useRouter()
  const shareUrl = params.shareUrl as string
  const [bookList, setBookList] = useState<BookList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showLocationEdit, setShowLocationEdit] = useState(false)
  const [updatingLocation, setUpdatingLocation] = useState(false)
  const [showAddBooks, setShowAddBooks] = useState(false)
  const [locationRequired, setLocationRequired] = useState(false)

  const fetchList = useCallback(async () => {
    try {
      const response = await fetch(`/api/lists/${shareUrl}`)
      if (!response.ok) {
        throw new Error('List not found')
      }
      const data = await response.json()

      // Check if user can edit this list
      if (!data.canEdit) {
        router.push(`/list/${shareUrl}`)
        return
      }

      setBookList(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load list')
    } finally {
      setLoading(false)
    }
  }, [shareUrl, router])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleNameChange = async (newName: string) => {
    if (!bookList) return

    try {
      const response = await fetch(`/api/lists/${shareUrl}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      })

      if (!response.ok) {
        throw new Error('Failed to update list name')
      }

      setBookList(prev => prev ? { ...prev, name: newName } : null)
    } catch (err) {
      console.error('Error updating list name:', err)
      alert('Failed to update list name')
    }
  }

  const handleBooksUpdate = async (updatedBooks: Book[]) => {
    if (!bookList) return

    setSaving(true)
    try {
      const response = await fetch(`/api/lists/${shareUrl}/books`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ books: updatedBooks }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to update books (${response.status})`
        throw new Error(errorMessage)
      }

      setBookList(prev => prev ? { ...prev, books: updatedBooks } : null)
    } catch (err) {
      console.error('Error updating books:', err)
      alert('Failed to update books')
    } finally {
      setSaving(false)
    }
  }

  const handleLocationUpdate = async (location: { latitude: number; longitude: number } | null) => {
    if (!bookList) return

    setUpdatingLocation(true)
    try {
      const requestData = location
        ? { latitude: location.latitude, longitude: location.longitude }
        : { remove: true }

      const response = await fetch(`/api/lists/${shareUrl}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error('Failed to update location')
      }

      const updatedList = await response.json()
      setBookList(prev => prev ? { ...prev, ...updatedList } : null)
      setShowLocationEdit(false)
    } catch (err) {
      console.error('Error updating location:', err)
      alert('Failed to update location')
    } finally {
      setUpdatingLocation(false)
    }
  }

  const handleRemoveLocation = async () => {
    if (confirm('Remove location from this list?')) {
      setUpdatingLocation(true)
      try {
        const response = await fetch(`/api/lists/${shareUrl}/location`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ remove: true }),
        })

        if (!response.ok) {
          throw new Error('Failed to remove location')
        }

        const updatedList = await response.json()
        setBookList(prev => prev ? { ...prev, ...updatedList } : null)
      } catch (err) {
        console.error('Error removing location:', err)
        alert('Failed to remove location')
      } finally {
        setUpdatingLocation(false)
      }
    }
  }

  const handleBooksAdded = (newBooks: Book[]) => {
    setBookList(prev => prev ? {
      ...prev,
      books: [...prev.books, ...newBooks]
    } : null)
    setShowAddBooks(false)
  }

  const handlePurposeChange = async (purpose: ListPurpose) => {
    if (!bookList) return

    try {
      const response = await fetch(`/api/lists/${shareUrl}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purpose }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update list purpose')
      }

      setBookList(prev => prev ? { ...prev, purpose } : null)
    } catch (err) {
      console.error('Error updating list purpose:', err)
      if (err instanceof Error && err.message.includes('constraint')) {
        alert('This purpose option is currently not available. Please try a different purpose.')
      } else {
        alert('Failed to update list purpose')
      }
    }
  }

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
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Go to My Lists
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
            <Link href={`/list/${shareUrl}`} className="text-blue-600 hover:text-blue-700">{bookList.name}</Link>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-gray-500">Edit</span>
          </nav>
        </div>

        {/* Title and Book Count */}
        <div className="text-center mb-8">
          {bookList.isManager ? (
            <EditListName
              initialName={bookList.name}
              onNameUpdate={handleNameChange}
            />
          ) : (
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{bookList.name}</h1>
          )}
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-gray-600">
              {bookList.books.length} {bookList.books.length === 1 ? 'book' : 'books'}
            </p>
            {bookList.isManager && (
              <>
                <span className="text-gray-400">|</span>
                <ListPurposeSelector
                  initialPurpose={bookList.purpose || 'sharing'}
                  onPurposeChange={handlePurposeChange}
                  onLocationRequiredChange={setLocationRequired}
                  dropdown={true}
                />
              </>
            )}
          </div>
          {!bookList.isManager && bookList.purpose === 'minilibrary' && (
            <p className="text-sm text-emerald-600 mt-1">
              📚 Community-managed mini library
            </p>
          )}
        </div>

        {/* Location Section - Only show when required or already exists, and only editable by managers */}
        {bookList.isManager && (
          <div className="text-center mb-8">
            <div className="text-sm text-gray-600">
              {bookList.location_name || bookList.city ? (
                <div className="flex items-center justify-center gap-2">
                  <span>📍 {bookList.location_name && bookList.city
                    ? `${bookList.location_name}, ${bookList.city}`
                    : bookList.location_name || bookList.city}
                    {bookList.country && `, ${bookList.country}`}
                  </span>
                  <button
                    onClick={() => setShowLocationEdit(true)}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleRemoveLocation}
                    className="text-red-600 hover:text-red-700 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : locationRequired ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 mb-2">📍 Location required for this purpose</p>
                  <button
                    onClick={() => setShowLocationEdit(true)}
                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                  >
                    Add Location
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLocationEdit(true)}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Add Location (Optional)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Location Edit Section */}
        {showLocationEdit && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {bookList.location_name || bookList.city ? 'Update' : 'Add'} Location
            </h2>
            {updatingLocation ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mr-3"></div>
                <span className="text-gray-600">Updating location...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <LocationCapture
                  onLocationCapture={handleLocationUpdate}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLocationEdit(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}



        {/* Editable Book Grid */}
        <EditableBookGrid
          books={bookList.books}
          onBooksUpdate={handleBooksUpdate}
          isLoading={saving}
          onAddBooksClick={() => setShowAddBooks(true)}
        />

        {/* Actions */}
        <div className="text-center mt-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/list/${shareUrl}`}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Updated List
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to My Lists
            </Link>
          </div>
        </div>
      </div>

      {/* Add Books Lightbox/Modal */}
      {showAddBooks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AddBooksToList
              shareUrl={shareUrl}
              onCancel={() => setShowAddBooks(false)}
              onBooksAdded={handleBooksAdded}
            />
          </div>
        </div>
      )}
    </div>
  )
}