import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeArchive } from '@/lib/scraping/scraping-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, month, categoryCode } = body

    if (!year || !month || !categoryCode) {
      return NextResponse.json(
        { error: 'Year, month, and categoryCode are required' },
        { status: 400 }
      )
    }

    const result = await scrapeArchive(prisma, year, month, categoryCode)
    
    return NextResponse.json({
      success: result.success,
      totalRecords: result.totalRecords || 0,
      error: result.error
    })
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}