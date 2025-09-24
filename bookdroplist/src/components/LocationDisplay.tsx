'use client'

interface LocationDisplayProps {
  city?: string
  country?: string
  locationName?: string
  latitude?: number
  longitude?: number
}

export default function LocationDisplay({
  city,
  country,
  locationName,
  latitude,
  longitude
}: LocationDisplayProps) {
  if (!city && !country && !locationName) {
    return null
  }

  const getLocationText = () => {
    if (locationName && city) {
      return `${locationName}, ${city}`
    } else if (locationName) {
      return locationName
    } else if (city && country) {
      return `${city}, ${country}`
    } else if (city) {
      return city
    } else if (country) {
      return country
    }
    return 'Unknown location'
  }

  const handleViewOnMap = () => {
    if (latitude && longitude) {
      // Open Google Maps with approximate location
      const url = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="bg-green-50 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-green-600"
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

          <div>
            <div className="text-sm font-medium text-gray-900">
              📍 Found near {getLocationText()}
            </div>
            <div className="text-xs text-gray-600">
              Approximate location (within ~300m for privacy)
            </div>
          </div>
        </div>

        {latitude && longitude && (
          <button
            onClick={handleViewOnMap}
            className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center space-x-1"
          >
            <span>View on Map</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}