// app/api/admin/scraping/check-duplicates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 各期間のスクレイピングログ数を集計
    const logs = await prisma.scrapingLog.findMany({
      where: {
        success: true,
        dataSource: 'archive'
      },
      select: {
        categoryCode: true,
        rankingDate: true
      }
    })
    
    // 年月・カテゴリごとに集計
    const periodMap = new Map<string, Map<string, number>>()
    
    logs.forEach(log => {
      const year = log.rankingDate.getFullYear()
      const month = log.rankingDate.getMonth() + 1
      const periodKey = `${year}-${month}`
      
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, new Map())
      }
      
      const categoryMap = periodMap.get(periodKey)!
      const count = categoryMap.get(log.categoryCode) || 0
      categoryMap.set(log.categoryCode, count + 1)
    })
    
    // 重複を検出
    const duplicates: any[] = []
    periodMap.forEach((categoryMap, periodKey) => {
      categoryMap.forEach((count, categoryCode) => {
        if (count > 1) {
          const [year, month] = periodKey.split('-').map(Number)
          duplicates.push({
            year,
            month,
            categoryCode,
            count,
            displayName: `${year}年${month}月 - ${categoryCode}`,
            excess: count - 1
          })
        }
      })
    })
    
    // 期間ごとの集計も計算
    const periodSummary: any[] = []
    periodMap.forEach((categoryMap, periodKey) => {
      const [year, month] = periodKey.split('-').map(Number)
      const totalCategories = categoryMap.size
      const totalRecords = Array.from(categoryMap.values()).reduce((sum, count) => sum + count, 0)
      
      if (totalRecords > totalCategories) {
        periodSummary.push({
          year,
          month,
          displayName: `${year}年${month}月`,
          expectedCount: Math.min(totalCategories, 44),
          actualCount: totalRecords,
          duplicateCount: totalRecords - totalCategories
        })
      }
    })
    
    return NextResponse.json({
      hasDuplicates: duplicates.length > 0,
      duplicates,
      periodSummary,
      totalDuplicateRecords: duplicates.reduce((sum, d) => sum + d.excess, 0)
    })
  } catch (error) {
    console.error('Duplicate check error:', error)
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    )
  }
}

// 重複を削除
export async function DELETE(request: NextRequest) {
  try {
    const { year, month } = await request.json()
    
    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      )
    }
    
    // 該当月の全スクレイピングログを取得
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    
    const logs = await prisma.scrapingLog.findMany({
      where: {
        rankingDate: {
          gte: startDate,
          lte: endDate
        },
        success: true,
        dataSource: 'archive'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // カテゴリごとに最新のログのみを残す
    const keepLogIds = new Map<string, number>()
    const deleteLogIds: number[] = []
    
    logs.forEach(log => {
      const key = `${log.categoryCode}-${log.rankingDate.toISOString()}`
      if (!keepLogIds.has(key)) {
        keepLogIds.set(key, log.id)
      } else {
        deleteLogIds.push(log.id)
      }
    })
    
    let deletedRankingsCount = 0
    let deletedLogsCount = 0
    
    if (deleteLogIds.length > 0) {
      // トランザクションで削除
      await prisma.$transaction(async (tx) => {
        // 関連するランキングデータを削除
        const deletedRankings = await tx.ranking.deleteMany({
          where: {
            scrapingLogId: {
              in: deleteLogIds
            }
          }
        })
        deletedRankingsCount = deletedRankings.count
        
        // スクレイピングログを削除
        const deletedLogs = await tx.scrapingLog.deleteMany({
          where: {
            id: {
              in: deleteLogIds
            }
          }
        })
        deletedLogsCount = deletedLogs.count
        
        // アーカイブ期間の統計を更新
        const remainingLogs = await tx.scrapingLog.count({
          where: {
            rankingDate: {
              gte: startDate,
              lte: endDate
            },
            success: true,
            dataSource: 'archive'
          }
        })
        
        await tx.archivePeriod.update({
          where: {
            year_month: {
              year,
              month
            }
          },
          data: {
            processedCategories: remainingLogs,
            isProcessed: remainingLogs >= 44
          }
        })
      })
    }
    
    return NextResponse.json({
      success: true,
      deletedRankings: deletedRankingsCount,
      deletedLogs: deletedLogsCount,
      message: `Cleaned up ${deletedLogsCount} duplicate entries`
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to clean duplicates' },
      { status: 500 }
    )
  }
}