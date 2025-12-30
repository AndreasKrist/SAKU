import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateProfitLoss } from '@/lib/supabase/queries'
import { getBusinessMembers } from '@/lib/supabase/queries'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, periodStart, periodEnd, distributionPercentage } = body

    if (!businessId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Parameter tidak lengkap' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user is member
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { data: member } = await supabase
      .from('business_members')
      .select('id, role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'Anda bukan anggota bisnis ini' },
        { status: 403 }
      )
    }

    // Calculate profit/loss
    const profitLoss = await calculateProfitLoss(businessId, periodStart, periodEnd)

    // Get members for allocation
    const members = await getBusinessMembers(businessId)

    // Calculate distribution
    const percentage = distributionPercentage || 100
    const distributedAmount = profitLoss.net_profit * (percentage / 100)

    const allocations = members.map((m) => ({
      member_name: m.profile?.full_name || 'Unknown User',
      equity: Number(m.equity_percentage),
      amount: distributedAmount * (Number(m.equity_percentage) / 100),
    }))

    return NextResponse.json({
      success: true,
      preview: {
        total_profit: profitLoss.net_profit,
        distributed_amount: distributedAmount,
        allocations,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
