import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    // Verify user is member of business
    const { data: membership } = await supabase
      .from('business_members')
      .select('id')
      .eq('business_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Anda bukan anggota bisnis ini' },
        { status: 403 }
      )
    }

    // Get all members
    const { data: members, error } = await supabase
      .from('business_members')
      .select(`
        id,
        user_id,
        role,
        equity_percentage,
        profile:profiles(full_name, email)
      `)
      .eq('business_id', params.id)
      .order('equity_percentage', { ascending: false })

    if (error) throw error

    return NextResponse.json(members)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
