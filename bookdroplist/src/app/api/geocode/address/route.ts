import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.error('Google Maps API key not configured')

      // For testing: provide some mock coordinates for common places
      const mockLocations: Record<string, { lat: number; lng: number; formatted_address: string; city: string; country: string }> = {
        'san francisco': { lat: 37.7749, lng: -122.4194, formatted_address: 'San Francisco, CA, USA', city: 'San Francisco', country: 'United States' },
        'new york': { lat: 40.7128, lng: -74.0060, formatted_address: 'New York, NY, USA', city: 'New York', country: 'United States' },
        'london': { lat: 51.5074, lng: -0.1278, formatted_address: 'London, UK', city: 'London', country: 'United Kingdom' },
        'paris': { lat: 48.8566, lng: 2.3522, formatted_address: 'Paris, France', city: 'Paris', country: 'France' },
        'tokyo': { lat: 35.6762, lng: 139.6503, formatted_address: 'Tokyo, Japan', city: 'Tokyo', country: 'Japan' },
        'berkeley': { lat: 37.8715, lng: -122.2730, formatted_address: 'Berkeley, CA, USA', city: 'Berkeley', country: 'United States' },
      }

      const normalizedAddress = address.toLowerCase()
      const mockLocation = Object.keys(mockLocations).find(key =>
        normalizedAddress.includes(key)
      )

      if (mockLocation) {
        const location = mockLocations[mockLocation]
        return NextResponse.json({
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: location.formatted_address,
          location_name: location.formatted_address.split(',')[0],
          city: location.city,
          country: location.country,
          _mock: true
        })
      }

      return NextResponse.json({
        error: 'Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to your .env.local file.',
        help: 'Get a free API key at: https://console.cloud.google.com/google/maps-apis/overview'
      }, { status: 500 })
    }

    // Use Google Maps Geocoding API to convert address to coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`

    const response = await fetch(geocodeUrl)

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data = await response.json()

    if (data.status !== 'OK' || !data.results.length) {
      return NextResponse.json({
        error: 'Address not found',
        details: data.status === 'ZERO_RESULTS' ? 'No results found for this address' : data.status
      }, { status: 404 })
    }

    const result = data.results[0]
    const location = result.geometry.location

    // Extract address components for better location info
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

    // Use formatted address as fallback for location name
    if (!location_name && result.formatted_address) {
      const parts = result.formatted_address.split(',')
      location_name = parts[0]?.trim() || ''
    }

    return NextResponse.json({
      latitude: location.lat,
      longitude: location.lng,
      formatted_address: result.formatted_address,
      location_name: location_name || undefined,
      city: city || undefined,
      country: country || undefined
    })

  } catch (error) {
    console.error('Error geocoding address:', error)
    return NextResponse.json(
      { error: 'Failed to find location' },
      { status: 500 }
    )
  }
}