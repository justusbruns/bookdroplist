'use client'

import { useState, useEffect, useCallback } from 'react'

interface FavoriteButtonProps {
  listId: string
  isOwner: boolean
}

export default function FavoriteButton({ listId, isOwner }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkAuthAndFavoriteStatus = useCallback(async () => {
    try {
      // Check if user is authenticated
      const profileResponse = await fetch('/api/user/profile')
      if (!profileResponse.ok) {
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(true)

      // Check if list is favorited
      const favoritesResponse = await fetch('/api/user/favorites')
      if (favoritesResponse.ok) {
        const data = await favoritesResponse.json()
        const isFav = data.favorites?.some((fav: { list_id: string }) => fav.list_id === listId)
        setIsFavorited(isFav)
      }
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }, [listId])

  useEffect(() => {
    checkAuthAndFavoriteStatus()
  }, [checkAuthAndFavoriteStatus])

  const toggleFavorite = async () => {
    if (!isAuthenticated || isOwner) return

    setIsLoading(true)
    try {
      const method = isFavorited ? 'DELETE' : 'POST'
      const response = await fetch('/api/user/favorites', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ listId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update favorite')
      }

      setIsFavorited(!isFavorited)
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert(error instanceof Error ? error.message : 'Failed to update favorite')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show for unauthenticated users or list owners
  if (!isAuthenticated || isOwner) {
    return null
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
        isFavorited
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <svg
        className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-current' : 'stroke-current fill-none'}`}
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {isLoading
        ? 'Loading...'
        : isFavorited
        ? 'Remove from Favorites'
        : 'Add to Favorites'
      }
    </button>
  )
}