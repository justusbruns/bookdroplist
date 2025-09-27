'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface List {
  id: string
  name: string
  share_url: string
  created_at: string
  location_name?: string
  city?: string
  country?: string
  book_count: number
}

interface FavoriteList {
  id: string
  list_id: string
  lists: List
}

export default function Dashboard() {
  const [myLists, setMyLists] = useState<List[]>([])
  const [favoriteLists, setFavoriteLists] = useState<FavoriteList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ shareUrl: string; listId: string; listName: string } | null>(null)
  const router = useRouter()

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load user data and lists
      const [userResponse, listsResponse, favoritesResponse] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/lists'),
        fetch('/api/user/favorites')
      ])

      if (userResponse.status === 401) {
        router.push('/')
        return
      }

      if (!userResponse.ok) {
        throw new Error('Failed to load user data')
      }

      const userData = await userResponse.json()
      setUser(userData)

      if (listsResponse.ok) {
        const listsData = await listsResponse.json()
        setMyLists(listsData.lists || [])
      }

      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json()
        setFavoriteLists(favoritesData.favorites || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleDeleteList = (shareUrl: string, listId: string, listName: string) => {
    setShowDeleteConfirm({ shareUrl, listId, listName })
  }

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return

    const { shareUrl, listId } = showDeleteConfirm
    setShowDeleteConfirm(null)

    try {
      const response = await fetch(`/api/lists/delete/${shareUrl}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete list')
      }

      setMyLists(prev => prev.filter(list => list.id !== listId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list')
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(null)
  }

  const handleRemoveFavorite = async (listId: string) => {
    try {
      const response = await fetch('/api/user/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ listId })
      })

      if (!response.ok) {
        throw new Error('Failed to remove favorite')
      }

      setFavoriteLists(prev => prev.filter(fav => fav.list_id !== listId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove favorite')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (err) {
      console.error('Logout error:', err)
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
            <span className="text-gray-500">My Lists</span>
          </nav>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Lists
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.email}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
              <Link
                href="/?create=true"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
              >
                📚 Create New List
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Lists */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              My Book Lists ({myLists.length})
            </h2>

            {myLists.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">You haven't created any lists yet</p>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Your First List
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myLists.map((list) => (
                  <div key={list.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{list.name}</h3>
                      <div className="flex gap-2">
                        <Link
                          href={`/list/${list.share_url}/edit`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteList(list.share_url, list.id, list.name)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{list.book_count} book{list.book_count !== 1 ? 's' : ''}</p>
                      {list.location_name && (
                        <p>📍 {list.location_name}</p>
                      )}
                      <p>Created {new Date(list.created_at).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/list/${list.share_url}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View List →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorite Lists */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Favorite Lists ({favoriteLists.length})
            </h2>

            {favoriteLists.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">No favorite lists yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  Discover and favorite lists from other users
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {favoriteLists.map((favorite) => (
                  <div key={favorite.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{favorite.lists.name}</h3>
                      <button
                        onClick={() => handleRemoveFavorite(favorite.list_id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{favorite.lists.book_count} book{favorite.lists.book_count !== 1 ? 's' : ''}</p>
                      {favorite.lists.location_name && (
                        <p>📍 {favorite.lists.location_name}</p>
                      )}
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/list/${favorite.lists.share_url}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View List →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Custom Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete List
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{showDeleteConfirm.listName}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}