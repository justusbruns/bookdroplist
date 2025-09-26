'use client'

import type { Book } from '@/types'

interface GeneratedBookCoverProps {
  book: Book
  className?: string
}

// Generate colors based on title hash for consistency
function generateColorFromTitle(title: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  const colors = [
    { bg: 'from-blue-500 to-blue-700', text: 'text-white' },
    { bg: 'from-emerald-500 to-emerald-700', text: 'text-white' },
    { bg: 'from-purple-500 to-purple-700', text: 'text-white' },
    { bg: 'from-red-500 to-red-700', text: 'text-white' },
    { bg: 'from-orange-500 to-orange-700', text: 'text-white' },
    { bg: 'from-indigo-500 to-indigo-700', text: 'text-white' },
    { bg: 'from-pink-500 to-pink-700', text: 'text-white' },
    { bg: 'from-teal-500 to-teal-700', text: 'text-white' },
    { bg: 'from-cyan-500 to-cyan-700', text: 'text-white' },
    { bg: 'from-amber-500 to-amber-700', text: 'text-white' },
    { bg: 'from-slate-600 to-slate-800', text: 'text-white' },
    { bg: 'from-stone-600 to-stone-800', text: 'text-white' },
  ]

  return colors[Math.abs(hash) % colors.length]
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export default function GeneratedBookCover({ book, className = '' }: GeneratedBookCoverProps) {
  const { bg, text } = generateColorFromTitle(book.title)

  const truncatedTitle = truncateText(book.title, 45)
  const truncatedAuthor = truncateText(book.author, 30)

  return (
    <div className={`w-full aspect-[2/3] bg-gradient-to-br ${bg} ${text} p-3 flex flex-col justify-between relative overflow-hidden ${className}`}>
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Title section */}
        <div className="flex-1 flex items-start">
          <div className="w-full">
            <h3 className="font-bold leading-tight text-sm mb-1">
              {truncatedTitle}
            </h3>
          </div>
        </div>

        {/* Author section at bottom */}
        <div className="mt-auto">
          <div className="border-t border-current border-opacity-30 pt-2 mt-2">
            <p className="text-xs font-medium opacity-90">
              {truncatedAuthor}
            </p>
          </div>
        </div>
      </div>

      {/* Subtle book spine lines */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-current opacity-20"></div>
      <div className="absolute left-1 top-0 bottom-0 w-px bg-current opacity-10"></div>
    </div>
  )
}