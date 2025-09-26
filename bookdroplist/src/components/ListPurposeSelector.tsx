'use client'

import { useState, useRef, useEffect } from 'react'
import type { ListPurpose } from '@/types'

interface ListPurposeSelectorProps {
  initialPurpose?: ListPurpose
  onPurposeChange: (purpose: ListPurpose) => void
  onLocationRequiredChange: (required: boolean) => void
  dropdown?: boolean
}

const purposeOptions = [
  { value: 'sharing' as ListPurpose, label: 'Share', requiresLocation: false },
  { value: 'pickup' as ListPurpose, label: 'Free', requiresLocation: true },
  { value: 'borrowing' as ListPurpose, label: 'Borrow', requiresLocation: true },
  { value: 'buying' as ListPurpose, label: 'Selling', requiresLocation: true },
  { value: 'minilibrary' as ListPurpose, label: 'Little Free Library', requiresLocation: true }
]

export default function ListPurposeSelector({
  initialPurpose = 'sharing',
  onPurposeChange,
  onLocationRequiredChange,
  dropdown = false
}: ListPurposeSelectorProps) {
  const [selectedPurpose, setSelectedPurpose] = useState<ListPurpose>(initialPurpose)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handlePurposeChange = (purpose: ListPurpose) => {
    setSelectedPurpose(purpose)
    onPurposeChange(purpose)
    setIsOpen(false)

    const option = purposeOptions.find(opt => opt.value === purpose)
    onLocationRequiredChange(option?.requiresLocation || false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (dropdown) {
    const selectedOption = purposeOptions.find(opt => opt.value === selectedPurpose)

    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>{selectedOption?.label}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[120px]">
            {purposeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePurposeChange(option.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                  selectedPurpose === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Purpose:
      </h3>
      <div className="flex flex-wrap gap-2">
        {purposeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePurposeChange(option.value)}
            className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              selectedPurpose === option.value
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 hover:text-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}