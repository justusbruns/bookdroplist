'use client'

import { useState } from 'react'
import type { ListPurpose } from '@/types'

interface ListPurposeSelectorProps {
  initialPurpose?: ListPurpose
  onPurposeChange: (purpose: ListPurpose) => void
  onLocationRequiredChange: (required: boolean) => void
}

const purposeOptions = [
  { value: 'sharing' as ListPurpose, label: '📤 Share', requiresLocation: false },
  { value: 'pickup' as ListPurpose, label: '🎁 Free', requiresLocation: true },
  { value: 'borrowing' as ListPurpose, label: '📖 Borrow', requiresLocation: true },
  { value: 'buying' as ListPurpose, label: '💵 Selling', requiresLocation: true },
  { value: 'searching' as ListPurpose, label: '🔍 Looking', requiresLocation: false },
  { value: 'minilibrary' as ListPurpose, label: '📚 Little Free Library', requiresLocation: true }
]

export default function ListPurposeSelector({
  initialPurpose = 'sharing',
  onPurposeChange,
  onLocationRequiredChange
}: ListPurposeSelectorProps) {
  const [selectedPurpose, setSelectedPurpose] = useState<ListPurpose>(initialPurpose)

  const handlePurposeChange = (purpose: ListPurpose) => {
    setSelectedPurpose(purpose)
    onPurposeChange(purpose)

    const option = purposeOptions.find(opt => opt.value === purpose)
    onLocationRequiredChange(option?.requiresLocation || false)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Purpose of this list:
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {purposeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePurposeChange(option.value)}
            className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              selectedPurpose === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option.label}
            {option.requiresLocation && (
              <div className="text-xs text-gray-500 mt-1">📍 Location required</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}