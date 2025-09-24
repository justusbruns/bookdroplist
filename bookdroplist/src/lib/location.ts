interface GeocodeResult {
  latitude: number
  longitude: number
  location_name?: string
  city?: string
  country?: string
}

// Add random offset within ~300m radius for privacy
export function fuzzLocation(lat: number, lng: number): { latitude: number; longitude: number } {
  // 300m in degrees (approximately)
  const radius = 0.0027 // ~300m in degrees at equator

  // Generate random angle and distance
  const angle = Math.random() * 2 * Math.PI
  const distance = Math.random() * radius

  // Calculate offset
  const latOffset = distance * Math.cos(angle)
  const lngOffset = distance * Math.sin(angle) / Math.cos(lat * Math.PI / 180)

  return {
    latitude: lat + latOffset,
    longitude: lng + lngOffset
  }
}

export async function geocodeLocation(latitude: number, longitude: number): Promise<GeocodeResult | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error('Google Maps API key not configured')
      return null
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    )

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data = await response.json()

    if (data.status !== 'OK' || !data.results.length) {
      return null
    }

    const result = data.results[0]

    // Extract meaningful location components
    let city = ''
    let country = ''
    let location_name = ''

    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name
      } else if (component.types.includes('administrative_area_level_1') && !city) {
        city = component.long_name
      } else if (component.types.includes('country')) {
        country = component.long_name
      } else if (component.types.includes('establishment') || component.types.includes('point_of_interest')) {
        location_name = component.long_name
      }
    }

    // Fallback to formatted address for location name
    if (!location_name && result.formatted_address) {
      const parts = result.formatted_address.split(',')
      location_name = parts[0]?.trim() || ''
    }

    return {
      latitude,
      longitude,
      location_name: location_name || undefined,
      city: city || undefined,
      country: country || undefined
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

export function getCurrentLocation(): Promise<{ latitude: number; longitude: number; error?: string } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 0, longitude: 0, error: 'Geolocation not supported by this browser' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        let errorMessage = 'Unable to get location'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
          default:
            errorMessage = 'An unknown location error occurred'
            break
        }

        console.warn('Geolocation error:', errorMessage, error)
        resolve({ latitude: 0, longitude: 0, error: errorMessage })
      },
      {
        enableHighAccuracy: false, // Less strict for better compatibility
        timeout: 15000, // Longer timeout
        maximumAge: 600000 // 10 minutes
      }
    )
  })
}