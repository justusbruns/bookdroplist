'use client'

import { useMemo } from 'react'

interface LastUpdatedProps {
  updatedAt?: string
  purpose?: string
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
  }

  // For very old entries, show the actual date
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export default function LastUpdated({ updatedAt, purpose }: LastUpdatedProps) {
  const relativeTime = useMemo(() => {
    if (!updatedAt) return null
    return formatRelativeTime(updatedAt)
  }, [updatedAt])

  // Only show for mini libraries or when explicitly provided
  if (purpose !== 'minilibrary' && !updatedAt) {
    return null
  }

  if (!updatedAt || !relativeTime) {
    return (
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
          <span>⏰</span>
          <span className="text-sm">Last updated: Unknown</span>
        </div>
      </div>
    )
  }

  // Determine color based on how recent the update was
  const date = new Date(updatedAt)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  let colorClass = 'bg-green-50 text-green-700 border-green-200' // Recent (< 3 days)
  if (diffInDays >= 7) {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200' // Getting old (7+ days)
  }
  if (diffInDays >= 30) {
    colorClass = 'bg-red-50 text-red-700 border-red-200' // Very old (30+ days)
  }

  return (
    <div className="text-center mb-6">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${colorClass}`}>
        <span>⏰</span>
        <span className="text-sm font-medium">Last updated: {relativeTime}</span>
      </div>
      {purpose === 'minilibrary' && diffInDays >= 7 && (
        <p className="text-xs text-gray-500 mt-2">
          Little Free Library info might be outdated. Consider updating with a recent photo.
        </p>
      )}
    </div>
  )
}