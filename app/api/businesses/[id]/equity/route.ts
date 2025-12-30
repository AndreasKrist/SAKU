import { NextRequest, NextResponse } from 'next/server'
import { updateEquityDistribution } from '@/lib/actions/business'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { distributions } = body

    if (!distributions || !Array.isArray(distributions)) {
      return NextResponse.json(
        { error: 'Distributions array is required' },
        { status: 400 }
      )
    }

    const result = await updateEquityDistribution(params.id, distributions)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating equity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
