import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateArchivePeriods } from '@/lib/scraping/archive-utils'

export async function GET() {
  try {
    // 全期間を生成（2004年から）
    const allPeriods = generateArchivePeriods(2004, 1)
    
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