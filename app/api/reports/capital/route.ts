import { NextRequest, NextResponse } from 'next/server'
import { generateCapitalAccountsReport } from '@/lib/actions/reports'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID tidak ditemukan' },
        { status: 400 }
      )
    }

    const result = await generateCapitalAccountsReport(businessId)

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
