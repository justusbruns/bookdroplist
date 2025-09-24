'use client'

import { useState } from 'react'

interface ShareButtonProps {
  shareUrl: string
  listName: string
}

export default function ShareButton({ shareUrl, listName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}/list/${shareUrl}` : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listName,
          text: `Check out this book list: ${listName}`,
          url: fullUrl,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 text-sm text-gray-600 font-mono">
        {fullUrl}
      </div>

      <button
        onClick={handleCopy}
        className={`
          px-4 py-2 rounded-lg font-medium transition-colors text-sm
          ${copied
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}