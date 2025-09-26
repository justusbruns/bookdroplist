'use client'

import { useState, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'

const containerStyle = {
  width: '100%',
  height: '192px' // h-48
}

// Privacy circle component for non-exact locations
function PrivacyCircle({ center, radius }: { center: { lat: number; lng: number }; radius: number }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const circle = new google.maps.Circle({
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      map,
      center,
      radius
    })

    return () => {
      circle.setMap(null)
    }
  }, [map, center, radius])

  return null
}

interface MinimalMapProps {
  latitude?: number
  longitude?: number
  exactLatitude?: number
  exactLongitude?: number
  locationName?: string
  city?: string
  country?: string
  purpose?: string
}

export default function MinimalMap({
  latitude,
  longitude,
  exactLatitude,
  exactLongitude,
  city,
  purpose
}: MinimalMapProps) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [fullAddress, setFullAddress] = useState<string>('')
  const [loadingAddress, setLoadingAddress] = useState(false)

  const isMiniLibrary = purpose === 'minilibrary'
  const requiresPrivacy = purpose === 'pickup' || purpose === 'buying' || purpose === 'borrowing'

  // For mini libraries, use exact coordinates when available
  // For privacy-sensitive purposes, use fuzzy coordinates
  const displayLat = isMiniLibrary && exactLatitude ? exactLatitude : latitude
  const displayLng = isMiniLibrary && exactLongitude ? exactLongitude : longitude

  const mapCenter = { lat: displayLat || 0, lng: displayLng || 0 }

  const areaName = city || 'Location Area'

  // For mini libraries, fetch the full address using reverse geocoding
  useEffect(() => {
    if (isMiniLibrary && exactLatitude && exactLongitude && !fullAddress && googleMapsApiKey) {
      setLoadingAddress(true)

      const fetchAddress = async () => {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${exactLatitude},${exactLongitude}&key=${googleMapsApiKey}`
          )

          if (response.ok) {
            const data = await response.json()
            if (data.status === 'OK' && data.results.length > 0) {
              setFullAddress(data.results[0].formatted_address)
            }
          }
        } catch (error) {
          console.error('Error fetching address:', error)
        } finally {
          setLoadingAddress(false)
        }
      }

      fetchAddress()
    }
  }, [isMiniLibrary, exactLatitude, exactLongitude, googleMapsApiKey, fullAddress])

  if (!latitude || !longitude) {
    return null
  }

  if (!googleMapsApiKey) {
    console.error('Google Maps API key is missing.')
    // Render a disabled state or return null if the key is missing
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="relative w-full h-48 border border-gray-200 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Map requires configuration.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span>📍</span>
        {isMiniLibrary ? 'Little Free Library Location' : 'Location Area'}
      </h3>

      <div className="space-y-4">
        {isMiniLibrary && fullAddress ? (
          <div className="space-y-2">
            <p className="text-gray-700 font-medium text-sm">Exact Address:</p>
            <p className="text-gray-900 font-semibold">{fullAddress}</p>
          </div>
        ) : isMiniLibrary && loadingAddress ? (
          <div className="space-y-2">
            <p className="text-gray-700 font-medium text-sm">Exact Address:</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Loading address...</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 font-medium">{areaName}</p>
        )}

        <div className="relative w-full h-48 border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
          <APIProvider apiKey={googleMapsApiKey}>
            <Map
              mapId="bookdroplist-mini-library-map"
              style={containerStyle}
              defaultCenter={mapCenter}
              defaultZoom={13}
              disableDefaultUI={true}
              zoomControl={true}
            >
              {isMiniLibrary ? (
                // Mini libraries show exact marker
                <AdvancedMarker position={mapCenter} />
              ) : requiresPrivacy ? (
                // Privacy-sensitive purposes show a 500m radius circle
                <PrivacyCircle center={mapCenter} radius={500} />
              ) : (
                // Other purposes show regular marker
                <AdvancedMarker position={mapCenter} />
              )}
            </Map>
          </APIProvider>
        </div>

        <p className="text-xs text-gray-500 text-center">
          {isMiniLibrary
            ? 'Exact location shown'
            : requiresPrivacy
              ? 'Privacy area (~500m radius) • Exact location kept private'
              : 'Approximate area • Not exact location'
          }
        </p>
      </div>
    </div>
  )
}
