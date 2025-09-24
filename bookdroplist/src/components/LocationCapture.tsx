'use client'

import { useState, useEffect } from 'react'
import { getCurrentLocation } from '@/lib/location'

interface LocationCaptureProps {
  onLocationCapture: (location: { latitude: number; longitude: number } | null) => void
}

export default function LocationCapture({ onLocationCapture }: LocationCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [hasLocation, setHasLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addressInput, setAddressInput] = useState('')
  const [useGPS, setUseGPS] = useState(false)

  useEffect(() => {
    // Check if geolocation is supported
    if (navigator.geolocation) {
      setLocationEnabled(true)
    }
  }, [])

  const handleAddressLookup = async () => {
    if (!addressInput.trim()) {
      setError('Please enter an address')
      return
    }

    setIsGeocoding(true)
    setError(null)

    try {
      const response = await fetch('/api/geocode/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: addressInput.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to find location')
      }

      const result = await response.json()

      if (result.latitude && result.longitude) {
        setHasLocation(true)
        onLocationCapture({ latitude: result.latitude, longitude: result.longitude })
      } else {
        setError('Could not find that address. Please try a different address.')
      }
    } catch (error) {
      console.error('Failed to geocode address:', error)
      setError('Failed to find address. Please try again.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleCaptureLocation = async () => {
    setIsCapturing(true)
    setError(null)

    try {
      const result = await getCurrentLocation()

      if (result && !result.error && result.latitude !== 0 && result.longitude !== 0) {
        setHasLocation(true)
        onLocationCapture({ latitude: result.latitude, longitude: result.longitude })
      } else {
        const errorMsg = result?.error || 'Unable to get location'
        setError(errorMsg)
        onLocationCapture(null)
      }
    } catch (error) {
      console.error('Failed to capture location:', error)
      setError('Failed to get location')
      onLocationCapture(null)
    } finally {
      setIsCapturing(false)
    }
  }

  const handleSkipLocation = () => {
    onLocationCapture(null)
  }

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-blue-500 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            Add location to your book list
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {hasLocation
              ? "✅ Location set! Your exact location is kept private - only the general area (~300m radius) will be visible to others."
              : "Enter an address, landmark, or area name. Your exact location stays private - we only show the general area."
            }
          </p>

          {error && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!hasLocation && (
            <div className="space-y-4">
              {/* Address Input */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Enter address, city, or landmark..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddressLookup()}
                    disabled={isGeocoding}
                  />
                  <button
                    onClick={handleAddressLookup}
                    disabled={isGeocoding || !addressInput.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeocoding ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Finding...
                      </>
                    ) : (
                      'Find Location'
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Examples: "Central Park, NYC", "123 Main St, Boston", "University of California Berkeley"
                </p>
              </div>

              {/* GPS Option */}
              {!useGPS && locationEnabled && (
                <div className="border-t border-gray-200 pt-3">
                  <button
                    onClick={() => setUseGPS(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Or use my current GPS location instead
                  </button>
                </div>
              )}

              {useGPS && locationEnabled && (
                <div className="border-t border-gray-200 pt-3 space-y-3">
                  <p className="text-sm text-gray-600">Use your current location:</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCaptureLocation}
                      disabled={isCapturing}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCapturing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Getting location...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Use Current Location
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setUseGPS(false)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Back to Address
                    </button>
                  </div>
                </div>
              )}

              {/* Skip Option */}
              <div className="border-t border-gray-200 pt-3">
                <button
                  onClick={handleSkipLocation}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Skip location (you can add it later)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}