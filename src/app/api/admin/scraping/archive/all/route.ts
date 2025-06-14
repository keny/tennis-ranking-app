// app/api/admin/scraping/latest/route.ts
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

// app/api/admin/scraping/archive/all/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeAllArchives } from '@/lib/scraping/scraping-service'

// Node.jsランタイムを使用（Prismaのため）
export const runtime = 'nodejs'
export const maxDuration = 300 // 5分

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      startYear = 2004, 
      startMonth = 1, 
      endYear, 
      endMonth, 
      batchSize = 100,
      skipExisting = false 
    } = body

    // バックグラウンドで実行
    scrapeAllArchives(prisma, (progress) => {
      console.log(`Progress: ${progress.processedItems}/${progress.totalItems}`)
      if (progress.errors.length > 0 && progress.processedItems % 100 === 0) {
        console.log(`Recent errors: ${progress.errors.slice(-5).map(e => e.item).join(', ')}`)
      }
    }, {
      startYear,
      startMonth,
      endYear,
      endMonth,
      batchSize,
      skipExisting
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      message: 'Archive scraping started in background',
      details: {
        startYear,
        startMonth,
        endYear: endYear || 'current',
        endMonth: endMonth || 'current',
        skipExisting
      }
    })
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// app/api/admin/scraping/stats/route.ts
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

// app/api/admin/scraping/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const categoryCode = searchParams.get('categoryCode')
    const success = searchParams.get('success')

    const where: any = {}
    if (categoryCode) where.categoryCode = categoryCode
    if (success !== null) where.success = success === 'true'

    const [logs, total] = await Promise.all([
      prisma.scrapingLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          archivePeriod: true
        }
      }),
      prisma.scrapingLog.count({ where })
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// app/api/admin/scraping/periods/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateArchivePeriods } from '@/lib/scraping/archive-utils'

export async function GET() {
  try {
    // 全期間を生成
    const allPeriods = generateArchivePeriods()
    
    // 処理済み期間を取得
    const processedPeriods = await prisma.archivePeriod.findMany({
      select: {
        year: true,
        month: true,
        isProcessed: true,
        processedCategories: true,
        totalCategories: true
      }
    })
    
    // 処理状況をマップに変換
    const processedMap = new Map(
      processedPeriods.map(p => [`${p.year}-${p.month}`, p])
    )
    
    // 期間ごとの処理状況を作成
    const periods = allPeriods.map(period => {
      const key = `${period.year}-${period.month}`
      const processed = processedMap.get(key)
      
      return {
        ...period,
        isProcessed: processed?.isProcessed || false,
        processedCategories: processed?.processedCategories || 0,
        totalCategories: processed?.totalCategories || 44,
        completionRate: processed 
          ? Math.round((processed.processedCategories / processed.totalCategories) * 100)
          : 0
      }
    })
    
    return NextResponse.json({
      periods,
      summary: {
        total: periods.length,
        processed: periods.filter(p => p.isProcessed).length,
        partial: periods.filter(p => p.processedCategories > 0 && !p.isProcessed).length,
        unprocessed: periods.filter(p => p.processedCategories === 0).length
      }
    })
  } catch (error) {
    console.error('Periods error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// app/api/admin/scraping/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { CATEGORIES } from '@/lib/scraping/archive-utils'

export async function GET() {
  try {
    const categories = Object.entries(CATEGORIES).map(([code, info]) => ({
      code,
      ...info
    }))
    
    return NextResponse.json({
      categories,
      byGender: {
        male: categories.filter(c => c.gender === 'male'),
        female: categories.filter(c => c.gender === 'female')
      },
      byType: {
        singles: categories.filter(c => c.type === 'singles'),
        doubles: categories.filter(c => c.type === 'doubles')
      }
    })
  } catch (error) {
    console.error('Categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}