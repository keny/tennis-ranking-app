import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 開発環境でのみ使用
export async function DELETE(request: NextRequest) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }
  
  try {
    // 確認用のクエリパラメータをチェック
    const confirm = request.nextUrl.searchParams.get('confirm')
    if (confirm !== 'yes-delete-all-data') {
      return NextResponse.json(
        { error: 'Please confirm by adding ?confirm=yes-delete-all-data' },
        { status: 400 }
      )
    }
    
    // トランザクションで全データを削除
    const result = await prisma.$transaction([
      prisma.ranking.deleteMany({}),
      prisma.playerCategoryHistory.deleteMany({}),
      prisma.scrapingLog.deleteMany({}),
      prisma.player.deleteMany({}),
      prisma.archivePeriod.deleteMany({}),
    ])
    
    return NextResponse.json({
      success: true,
      message: 'All data deleted',
      deletedCounts: {
        rankings: result[0].count,
        playerCategoryHistory: result[1].count,
        scrapingLogs: result[2].count,
        players: result[3].count,
        archivePeriods: result[4].count,
      }
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to clean database' },
      { status: 500 }
    )
  }
}