'use client'

import { useState } from 'react'

interface ShareButtonProps {
  shareUrl: string
}

export default function ShareButton({ shareUrl }: ShareButtonProps) {
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


  return (
    <div className="flex items-center gap-2 w-80 mx-auto">
      <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 text-sm text-gray-600 font-mono flex-1 truncate">
        {fullUrl}
      </div>

      <button
        onClick={handleCopy}
        className={`
          px-3 py-2 rounded-lg transition-colors text-lg
          ${copied
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
        title={copied ? 'Copied!' : 'Copy Link'}
      >
        {copied ? '✓' : '📋'}
      </button>
    </div>
  )
}