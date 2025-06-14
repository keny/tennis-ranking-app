// app/api/admin/scraping/archive/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeArchive, scrapeArchivePeriod } from '@/lib/scraping/scraping-service'
import { CategoryCode, CATEGORIES } from '@/lib/scraping/archive-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, month, categoryCode } = body

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      )
    }

    if (categoryCode && CATEGORIES[categoryCode as CategoryCode]) {
      // 特定カテゴリをスクレイピング
      const result = await scrapeArchive(prisma, year, month, categoryCode as CategoryCode)
      
      return NextResponse.json({
        success: result.success,
        totalRecords: result.totalRecords,
        executionTimeMs: result.executionTimeMs,
        error: result.error
      })
    } else {
      // 全カテゴリをスクレイピング
      const results: any[] = []
      await scrapeArchivePeriod(prisma, year, month, (progress) => {
        console.log(`Progress: ${progress.processedItems}/${progress.totalItems}`)
      })
      
      return NextResponse.json({
        success: true,
        message: `All categories for ${year}/${month} scraped successfully`
      })
    }
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
