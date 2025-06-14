// app/analysis/category/page.tsx
import { prisma } from '@/lib/prisma';
import CategoryRankingFlow from '@/components/CategoryRankingFlow';
import CategoryDataStatus from '@/components/CategoryDataStatus';
import RankingAnalysisSection from '@/components/RankingAnalysisSection';
import { Suspense } from 'react';

// カテゴリー定義
const CATEGORIES = {
  gender: {
    male: '男子',
    female: '女子',
  },
  type: {
    singles: 'シングルス',
    doubles: 'ダブルス',
  },
  ageGroup: {
    35: '35歳以上',
    40: '40歳以上',
    45: '45歳以上',
    50: '50歳以上',
    55: '55歳以上',
    60: '60歳以上',
    65: '65歳以上',
    70: '70歳以上',
    75: '75歳以上',
    80: '80歳以上',
    85: '85歳以上',
  },
};

interface SearchParams {
  gender?: string;
  type?: string;
  ageGroup?: string;
  startYear?: string;
  startMonth?: string;
  endYear?: string;
  endMonth?: string;
}

// データ取得関数
async function getLatestPeriodData() {
  const latestRanking = await prisma.ranking.findFirst({
    orderBy: { rankingDate: 'desc' },
    select: { rankingDate: true }
  });

  if (!latestRanking) return null;

  const latestDate = new Date(latestRanking.rankingDate);
  const year = latestDate.getFullYear();
  const month = latestDate.getMonth() + 1;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const categories = await prisma.ranking.groupBy({
    by: ['gender', 'type', 'ageGroup'],
    where: {
      rankingDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
  });

  const total = categories.reduce((sum, cat) => sum + cat._count.id, 0);

  return {
    year,
    month,
    total,
    categories: categories.map(cat => ({
      gender: cat.gender,
      type: cat.type,
      ageGroup: cat.ageGroup,
      count: cat._count.id,
    })),
  };
}

export default async function CategoryAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // searchParamsをawaitする
  const params = await searchParams;
  
  // デフォルト値の設定
  const gender = params.gender || 'male';
  const type = params.type || 'singles';
  const ageGroup = params.ageGroup || '45';

  // 利用可能な期間を取得
  const periods = await prisma.ranking.findMany({
    select: {
      rankingDate: true,
    },
    distinct: ['rankingDate'],
    orderBy: {
      rankingDate: 'desc',
    },
    where: {
      gender: gender as 'male' | 'female',
      type: type as 'singles' | 'doubles',
      ageGroup: parseInt(ageGroup),
    },
  });

  const availablePeriods = periods.map(p => ({
    date: p.rankingDate,
    year: new Date(p.rankingDate).getFullYear(),
    month: new Date(p.rankingDate).getMonth() + 1,
  }));

  // デフォルトの期間設定（直近12ヶ月）
  const latestPeriod = availablePeriods[0];
  const endYear = params.endYear || latestPeriod?.year.toString();
  const endMonth = params.endMonth || latestPeriod?.month.toString();
  
  const defaultStartDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 11); // 12ヶ月前
  
  const startYear = params.startYear || defaultStartDate.getFullYear().toString();
  const startMonth = params.startMonth || (defaultStartDate.getMonth() + 1).toString();

  // 最新期間のデータを取得
  const periodData = await getLatestPeriodData();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">カテゴリ別ランキング分析</h1>
      
      {/* データ取得状況 */}
      <div className="mb-8">
        <CategoryDataStatus periodData={periodData} />
      </div>
      
      {/* ランキング推移分析セクション */}
      <RankingAnalysisSection
        gender={gender}
        type={type}
        ageGroup={ageGroup}
        startYear={startYear}
        startMonth={startMonth}
        endYear={endYear}
        endMonth={endMonth}
        CATEGORIES={CATEGORIES}
      >
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">データを読み込み中...</div>
            </div>
          }
        >
          <CategoryRankingFlowWrapper
            gender={gender}
            type={type}
            ageGroup={parseInt(ageGroup)}
            startYear={parseInt(startYear)}
            startMonth={parseInt(startMonth)}
            endYear={parseInt(endYear)}
            endMonth={parseInt(endMonth)}
          />
        </Suspense>
      </RankingAnalysisSection>
    </div>
  );
}

// データフェッチを分離したラッパーコンポーネント（RankingAnalysisSectionから呼び出される）
export async function CategoryRankingFlowWrapper({
  gender,
  type,
  ageGroup,
  startYear,
  startMonth,
  endYear,
  endMonth,
}: {
  gender: string;
  type: string;
  ageGroup: number;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}) {
  // 期間内のランキングデータを取得
  const startDate = new Date(startYear, startMonth - 1, 1);
  const endDate = new Date(endYear, endMonth, 0, 23, 59, 59);

  const rankings = await prisma.ranking.findMany({
    where: {
      gender: gender as 'male' | 'female',
      type: type as 'singles' | 'doubles',
      ageGroup,
      rankingDate: {
        gte: startDate,
        lte: endDate,
      },
      rankPosition: {
        lte: 128, // Top 128のみ
      },
    },
    include: {
      player: true,
    },
    orderBy: [
      { rankingDate: 'asc' },
      { rankPosition: 'asc' },
    ],
  });

  // 期間ごとにグループ化
  const rankingsByPeriod = rankings.reduce((acc, ranking) => {
    const date = new Date(ranking.rankingDate);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!acc[key]) {
      acc[key] = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        rankings: [],
      };
    }
    
    acc[key].rankings.push(ranking);
    return acc;
  }, {} as Record<string, any>);

  const sortedPeriods = Object.values(rankingsByPeriod).sort((a: any, b: any) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  return <CategoryRankingFlow periods={sortedPeriods} />;
}