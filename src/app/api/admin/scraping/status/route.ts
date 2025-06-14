// app/api/admin/scraping/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 直近24時間のスクレイピングログを取得
    const since = new Date();
    since.setHours(since.getHours() - 24);
    
    const recentLogs = await prisma.scrapingLog.groupBy({
      by: ['success'],
      where: {
        createdAt: {
          gte: since
        }
      },
      _count: {
        id: true
      }
    });
    
    // 期間別の進捗を取得
    const periodProgress = await prisma.$queryRaw`
      SELECT 
        DATE(ranking_date) as date,
        COUNT(DISTINCT category_code) as completed_categories,
        COUNT(*) as total_records
      FROM scraping_logs
      WHERE created_at >= ${since}
      GROUP BY DATE(ranking_date)
      ORDER BY date DESC
      LIMIT 10
    `;
    
    // 現在処理中の推定（最新のログから）
    const latestLog = await prisma.scrapingLog.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        archivePeriod: true
      }
    });
    
    const stats = {
      last24Hours: {
        success: recentLogs.find(r => r.success)?._count.id || 0,
        failed: recentLogs.find(r => !r.success)?._count.id || 0,
        total: recentLogs.reduce((sum, r) => sum + r._count.id, 0)
      },
      periodProgress,
      latestActivity: latestLog ? {
        categoryCode: latestLog.categoryCode,
        rankingDate: latestLog.rankingDate,
        createdAt: latestLog.createdAt,
        archivePeriod: latestLog.archivePeriod
      } : null,
      isRunning: latestLog ? 
        (new Date().getTime() - latestLog.createdAt.getTime()) < 60000 : // 1分以内
        false
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}