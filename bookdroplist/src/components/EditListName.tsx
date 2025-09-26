'use client'

import { useState } from 'react'

interface EditListNameProps {
  initialName: string
  onNameUpdate: (newName: string) => void
}

export default function EditListName({ initialName, onNameUpdate }: EditListNameProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && name !== initialName) {
      onNameUpdate(name.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setName(initialName)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="inline-flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-3xl md:text-4xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 text-center"
          autoFocus
          maxLength={100}
        />
        <div className="flex gap-1">
          <button
            type="submit"
            className="p-1 text-green-600 hover:text-green-700"
            title="Save"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 text-gray-500 hover:text-gray-700"
            title="Cancel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </form>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group inline-flex items-center gap-2 text-3xl md:text-4xl font-bold text-gray-900 hover:text-blue-600 transition-colors px-3 py-1 rounded-md hover:bg-blue-50 border border-transparent hover:border-blue-200 mb-2"
      title="Click to edit list name"
    >
      {name}
      <svg
        className="w-6 h-6 opacity-30 group-hover:opacity-100 transition-opacity"
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
    </button>
  )
}