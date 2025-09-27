'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ImageUpload from '@/components/ImageUpload'
import ProcessingState from '@/components/ProcessingState'
import EmailRequest from '@/components/EmailRequest'
import EmailSent from '@/components/EmailSent'
import ManualBookEntry from '@/components/ManualBookEntry'

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const router = useRouter()

  // Check if user is already authenticated
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Check if user has an active session
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        setIsAuthenticated(true)
        // Only redirect to dashboard if not explicitly creating a new list
        // Check URL parameters for create flag
        const urlParams = new URLSearchParams(window.location.search)
        const isCreating = urlParams.get('create') === 'true'
        if (!isCreating) {
          router.push('/dashboard')
          return
        }
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setIsAuthenticated(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploadedImage(file)
    setShowImageUpload(false)
    setError(null)

    // Skip location capture and process immediately
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process image')
      }

      const { shareUrl } = await response.json()
      router.push(`/list/${shareUrl}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEmailSubmit = (email: string) => {
    setUserEmail(email)
    setEmailSent(true)
  }

  const handleBackToEmail = () => {
    setEmailSent(false)
    setUserEmail(null)
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        {isAuthenticated && (
          <div className="mb-6">
            <nav className="text-sm">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">My Lists</Link>
              <span className="mx-2 text-gray-500">/</span>
              <span className="text-gray-500">Create New List</span>
            </nav>
          </div>
        )}

        <div className="text-center mb-12">
          <div className="mb-6">
            <Image
              src="/logo.svg"
              alt="Book Drop List Logo"
              className="mx-auto w-24"
              width={96}
              height={96}
              style={{ height: 'auto' }}
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Book Drop List
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create your book lists and share them with ease.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">

          {checkingAuth ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : emailSent ? (
            <EmailSent email={userEmail!} onBack={handleBackToEmail} />
          ) : !isAuthenticated ? (
            <EmailRequest onEmailSubmit={handleEmailSubmit} />
          ) : isProcessing ? (
            <ProcessingState />
          ) : showManualEntry ? (
            <ManualBookEntry onCancel={() => setShowManualEntry(false)} />
          ) : showImageUpload ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Upload a photo of books</h2>
                <button
                  onClick={() => setShowImageUpload(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <ImageUpload onImageUpload={handleImageUpload} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Two Options for Creating Lists */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Choose how to create your book list
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Photo Upload Option */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer group"
                       onClick={() => setShowImageUpload(true)}>
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Photo</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Take a photo of book spines or covers and let AI identify them for you
                      </p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Fast & Automated
                      </span>
                    </div>
                  </div>

                  {/* Manual Entry Option */}
                  <div className="border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer group"
                       onClick={() => setShowManualEntry(true)}>
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Search & Add Books</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Search for books by title or author and add them one by one
                      </p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Precise Control
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">Multiple ways to create your lists</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                📷
              </div>
              <h3 className="text-lg font-semibold mb-2">Photo Upload</h3>
              <p className="text-gray-600">
                Take a photo of book spines or covers and let AI identify them automatically
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                🔍
              </div>
              <h3 className="text-lg font-semibold mb-2">Search & Add</h3>
              <p className="text-gray-600">
                Search our book database and add titles one by one with complete control
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                🔗
              </div>
              <h3 className="text-lg font-semibold mb-2">Share Instantly</h3>
              <p className="text-gray-600">
                Get a beautiful, shareable list with covers and details ready to share
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}