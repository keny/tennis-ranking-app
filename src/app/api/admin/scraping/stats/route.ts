import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getScrapingStats } from '@/lib/scraping/scraping-service'

export async function GET() {
  try {
    const stats = await getScrapingStats(prisma)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
