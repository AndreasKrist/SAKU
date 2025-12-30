import { NextRequest, NextResponse } from 'next/server'
import { generateCashFlowReport } from '@/lib/actions/reports'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, periodStart, periodEnd } = body

    if (!businessId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Parameter tidak lengkap' },
        { status: 400 }
      )
    }

    const result = await generateCashFlowReport(businessId, periodStart, periodEnd)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, report: result.report })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
