'use client'

import type { ListPurpose } from '@/types'

interface PurposeDisplayProps {
  purpose?: ListPurpose
  inline?: boolean
}

const purposeLabels = {
  sharing: 'Share',
  pickup: 'Free',
  borrowing: 'Borrow',
  buying: 'Selling',
  searching: 'Looking',
  minilibrary: 'Little Free Library'
}

const purposeIcons = {
  sharing: '📤',
  pickup: '🎁',
  borrowing: '📖',
  buying: '💵',
  searching: '🔍',
  minilibrary: '📚'
}

const purposeColors = {
  sharing: 'bg-blue-50 text-blue-700 border-blue-200',
  pickup: 'bg-green-50 text-green-700 border-green-200',
  borrowing: 'bg-purple-50 text-purple-700 border-purple-200',
  buying: 'bg-orange-50 text-orange-700 border-orange-200',
  searching: 'bg-gray-50 text-gray-700 border-gray-200',
  minilibrary: 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

export default function PurposeDisplay({ purpose = 'sharing', inline = false }: PurposeDisplayProps) {
  if (inline) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${purposeColors[purpose]}`}>
        <span className="text-sm">{purposeIcons[purpose]}</span>
        <span>{purposeLabels[purpose]}</span>
      </span>
    )
  }

  return (
    <div className="flex justify-center mb-6">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${purposeColors[purpose]}`}>
        <span className="text-lg">{purposeIcons[purpose]}</span>
        <span>{purposeLabels[purpose]}</span>
      </div>
    </div>
  )
}