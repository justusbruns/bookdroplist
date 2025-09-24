'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import type { Book } from '@/types'

interface MiniLibraryUpdateProps {
  listId: string
  currentBooks: Book[]
  onUpdateSubmit: (booksToAdd: Book[], booksToRemove: string[]) => void
  onCancel: () => void
}

interface BookChange {
  book: Book
  action: 'add' | 'remove'
  confidence: number
}

export default function MiniLibraryUpdate({
  listId,
  currentBooks,
  onUpdateSubmit,
  onCancel
}: MiniLibraryUpdateProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'confirm'>('upload')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [detectedChanges, setDetectedChanges] = useState<BookChange[]>([])
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set())

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setUploadedImage(previewUrl)
    setStep('processing')

    try {
      // Create FormData for the API call
      const formData = new FormData()
      formData.append('image', file)
      formData.append('listId', listId)
      formData.append('currentBooks', JSON.stringify(currentBooks))

      // Call API to detect book changes
      const response = await fetch('/api/mini-library/detect-changes', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setDetectedChanges(result.changes || [])

        // Pre-select high-confidence changes
        const highConfidenceChanges = new Set(
          result.changes
            .filter((change: BookChange) => change.confidence > 0.8)
            .map((change: BookChange) => `${change.action}-${change.book.id}`)
        )
        setSelectedChanges(highConfidenceChanges)

        setStep('confirm')
      } else {
        console.error('Failed to detect changes')
        setStep('upload')
      }
    } catch (error) {
      console.error('Error processing image:', error)
      setStep('upload')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false
  })

  const toggleChange = (changeId: string) => {
    const newSelected = new Set(selectedChanges)
    if (newSelected.has(changeId)) {
      newSelected.delete(changeId)
    } else {
      newSelected.add(changeId)
    }
    setSelectedChanges(newSelected)
  }

  const handleConfirmChanges = () => {
    const booksToAdd: Book[] = []
    const booksToRemove: string[] = []

    detectedChanges.forEach(change => {
      const changeId = `${change.action}-${change.book.id}`
      if (selectedChanges.has(changeId)) {
        if (change.action === 'add') {
          booksToAdd.push(change.book)
        } else {
          booksToRemove.push(change.book.id)
        }
      }
    })

    onUpdateSubmit(booksToAdd, booksToRemove)
  }

  if (step === 'upload') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            📷 Update Little Free Library
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Take a photo of the current books in the Little Free Library. Our AI will detect what&apos;s been added or removed.
        </p>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-gray-300 bg-white hover:border-emerald-400 hover:bg-emerald-50'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Snap a photo of the Little Free Library
              </h4>
              <p className="text-gray-600 mb-4">
                {isDragActive
                  ? 'Drop your photo here...'
                  : 'Drag and drop a photo, or click to select'
                }
              </p>
              <p className="text-sm text-gray-500">
                Get as many book covers visible as possible • JPEG, PNG, WebP
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'processing') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto mb-6"></div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Analyzing Little Free Library changes...
        </h3>

        <p className="text-gray-600 mb-6">
          Our AI is comparing the photo with the current book list to detect changes.
        </p>

        {uploadedImage && (
          <img
            src={uploadedImage}
            alt="Uploaded Little Free Library photo"
            className="max-h-48 mx-auto rounded-lg shadow-md mb-6"
          />
        )}

        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Detecting book covers and titles</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-75"></div>
            <span>Comparing with current list</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-150"></div>
            <span>Identifying changes</span>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    const booksToAdd = detectedChanges.filter(c => c.action === 'add')
    const booksToRemove = detectedChanges.filter(c => c.action === 'remove')

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            📋 Confirm Changes
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Review the detected changes and confirm what should be updated.
        </p>

        {uploadedImage && (
          <img
            src={uploadedImage}
            alt="Uploaded Little Free Library photo"
            className="max-h-32 mx-auto rounded-lg shadow-md mb-6"
          />
        )}

        <div className="space-y-6">
          {booksToAdd.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                <span>📚</span>
                Books to ADD ({booksToAdd.length})
              </h4>
              <div className="space-y-2">
                {booksToAdd.map(change => {
                  const changeId = `${change.action}-${change.book.id}`
                  return (
                    <div
                      key={changeId}
                      className="flex items-center gap-3 p-3 border border-green-200 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChanges.has(changeId)}
                        onChange={() => toggleChange(changeId)}
                        className="w-4 h-4 text-green-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{change.book.title}</div>
                        <div className="text-sm text-gray-600">{change.book.author}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(change.confidence * 100)}% confidence
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {booksToRemove.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                <span>📤</span>
                Books to REMOVE ({booksToRemove.length})
              </h4>
              <div className="space-y-2">
                {booksToRemove.map(change => {
                  const changeId = `${change.action}-${change.book.id}`
                  return (
                    <div
                      key={changeId}
                      className="flex items-center gap-3 p-3 border border-red-200 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChanges.has(changeId)}
                        onChange={() => toggleChange(changeId)}
                        className="w-4 h-4 text-red-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{change.book.title}</div>
                        <div className="text-sm text-gray-600">{change.book.author}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(change.confidence * 100)}% confidence
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {detectedChanges.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl mb-2 block">🔍</span>
              No changes detected. The Little Free Library appears to have the same books.
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmChanges}
            disabled={selectedChanges.size === 0}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Little Free Library ({selectedChanges.size} changes)
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Missing books? You can always add them manually after this update.
        </p>
      </div>
    )
  }

  return null
}