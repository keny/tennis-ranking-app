import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeLatestRanking, scrapeAllLatestRankings } from '@/lib/scraping/scraping-service'
import { CategoryCode, CATEGORIES } from '@/lib/scraping/archive-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categoryCode, all } = body

    if (all) {
      // 全カテゴリをスクレイピング
      const results: any[] = []
      await scrapeAllLatestRankings(prisma, (progress) => {
        console.log(`Progress: ${progress.processedItems}/${progress.totalItems}`)
      })
      
      return NextResponse.json({
        success: true,
        message: 'All latest rankings scraped successfully'
      })
    } else if (categoryCode && CATEGORIES[categoryCode as CategoryCode]) {
      // 特定カテゴリをスクレイピング
      const result = await scrapeLatestRanking(prisma, categoryCode as CategoryCode)
      
      return NextResponse.json({
        success: result.success,
        totalRecords: result.totalRecords,
        executionTimeMs: result.executionTimeMs,
        error: result.error
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid category code' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}