'use client'

import { useState } from 'react'

interface EditListDescriptionProps {
  initialDescription?: string
  onDescriptionUpdate: (newDescription: string) => void
}

export default function EditListDescription({ initialDescription = '', onDescriptionUpdate }: EditListDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState(initialDescription || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (description !== initialDescription) {
      onDescriptionUpdate(description.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDescription(initialDescription || '')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-gray-600 bg-transparent border-2 border-blue-500 focus:outline-none focus:border-blue-600 text-center resize-none rounded-lg p-3"
          placeholder="Add a description for your list (optional)"
          autoFocus
          maxLength={500}
          rows={3}
        />
        <div className="flex justify-center gap-2 mt-2">
          <button
            type="submit"
            className="px-3 py-1 text-green-600 hover:text-green-700 border border-green-200 hover:bg-green-50 rounded"
            title="Save"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1 text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 rounded"
            title="Cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group w-full max-w-2xl mx-auto text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-blue-50 border border-transparent hover:border-blue-200 min-h-[3rem] flex items-center justify-center"
      title="Click to edit description"
    >
      {description ? (
        <span className="flex items-center gap-2">
          {description}
          <svg
            className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </span>
      ) : (
        <span className="text-gray-400 italic flex items-center gap-2">
          Add a description (optional)
          <svg
            className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </span>
      )}
    </button>
  )
}