import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { geocodeLocation, fuzzLocation } from '@/lib/location'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shareUrl: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    const { shareUrl } = await params
    const { latitude, longitude, remove } = await request.json()

    // First, verify the list exists and belongs to the user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingList, error: findError } = await (supabaseAdmin as any)
      .from('lists')
      .select('id, user_id')
      .eq('share_url', shareUrl)
      .single()

    if (findError || !existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    if (existingList.user_id !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    let locationData = {}

    if (remove) {
      // Remove location data
      locationData = {
        exact_latitude: null,
        exact_longitude: null,
        public_latitude: null,
        public_longitude: null,
        location_name: null,
        city: null,
        country: null,
        updated_at: new Date().toISOString()
      }
    } else if (latitude && longitude) {
      // Add/update location data
      // Get location details via geocoding (server-side)
      const geocodeResult = await geocodeLocation(latitude, longitude)

      // Create fuzzy location for privacy
      const fuzzyLocation = fuzzLocation(latitude, longitude)

      locationData = {
        exact_latitude: latitude,
        exact_longitude: longitude,
        public_latitude: fuzzyLocation.latitude,
        public_longitude: fuzzyLocation.longitude,
        location_name: geocodeResult?.location_name,
        city: geocodeResult?.city,
        country: geocodeResult?.country,
        updated_at: new Date().toISOString()
      }
    } else {
      return NextResponse.json({ error: 'Invalid location data' }, { status: 400 })
    }

    // Update the list location using the admin client to bypass RLS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any)
      .from('lists')
      .update(locationData)
      .eq('id', existingList.id)
      .select()

    if (error) {
      console.error('Error updating list location:', error)
      return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.error('Update succeeded but no data returned')
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json(data[0])

  } catch (error) {
    console.error('Error updating list location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}