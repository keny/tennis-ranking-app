import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 基本統計情報
    const [totalPlayers, totalRankings] = await Promise.all([
      prisma.player.count(),
      prisma.ranking.count(),
    ]);

    // 最終更新日時（最新のランキングデータから取得）
    const lastRanking = await prisma.ranking.findFirst({
      orderBy: { rankingDate: 'desc' },
      select: { rankingDate: true },
    });

    // 期間別・カテゴリ別データ数を取得
    const periodCategoryCounts = await prisma.$queryRaw<Array<{
      year: number;
      month: number;
      gender: string;
      type: string;
      age_group: number;
      count: bigint;
    }>>`
      SELECT 
        EXTRACT(YEAR FROM ranking_date)::int as year,
        EXTRACT(MONTH FROM ranking_date)::int as month,
        gender,
        type,
        age_group,
        COUNT(*)::bigint as count
      FROM rankings
      GROUP BY year, month, gender, type, age_group
      ORDER BY year DESC, month DESC, gender, type, age_group
    `;

    // BigIntをnumberに変換し、期間ごとにグループ化
    const periodCountsMap = new Map<string, {
      year: number;
      month: number;
      total: number;
      categories: Array<{
        gender: string;
        type: string;
        ageGroup: number;
        count: number;
      }>;
    }>();

    periodCategoryCounts.forEach(record => {
      const periodKey = `${record.year}-${record.month}`;
      
      if (!periodCountsMap.has(periodKey)) {
        periodCountsMap.set(periodKey, {
          year: record.year,
          month: record.month,
          total: 0,
          categories: [],
        });
      }
      
      const period = periodCountsMap.get(periodKey)!;
      const count = Number(record.count);
      
      period.total += count;
      period.categories.push({
        gender: record.gender,
        type: record.type,
        ageGroup: record.age_group,
        count: count,
      });
    });

    const formattedPeriodCounts = Array.from(periodCountsMap.values());

    // ScrapingLog関連の統計情報も追加
    const [totalScrapingLogs, successfulScrapings, failedScrapings] = await Promise.all([
      prisma.scrapingLog.count(),
      prisma.scrapingLog.count({ where: { success: true } }),
      prisma.scrapingLog.count({ where: { success: false } }),
    ]);

    // 最終スクレイピング日時
    const lastScraping = await prisma.scrapingLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const successRate = totalScrapingLogs > 0 
      ? ((successfulScrapings / totalScrapingLogs) * 100).toFixed(2) + '%'
      : '0%';

    return NextResponse.json({
      totalPlayers,
      totalRankings,
      totalScrapingLogs,
      successfulScrapings,
      failedScrapings,
      successRate,
      lastScrapingDate: lastScraping?.createdAt || lastRanking?.rankingDate || null,
      periodCounts: formattedPeriodCounts,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}