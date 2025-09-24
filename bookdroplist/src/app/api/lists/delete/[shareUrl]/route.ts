import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shareUrl: string }> }
) {
  try {
    const session = await requireAuth()
    const { shareUrl } = await params

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    // Verify the list belongs to the user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: list, error: listError } = await (supabaseAdmin as any)
      .from('lists')
      .select('id, user_id')
      .eq('share_url', shareUrl)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    if (list.user_id !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the list (cascade will handle related records)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabaseAdmin as any)
      .from('lists')
      .delete()
      .eq('id', list.id)

    if (deleteError) {
      console.error('Error deleting list:', deleteError)
      return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete list endpoint:', error)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
}