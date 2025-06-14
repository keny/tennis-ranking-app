import { prisma } from '@/lib/prisma';
import RankingsTable from '@/components/RankingsTable';
import RankingsFilter from '@/components/RankingsFilter';
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
  year?: string;
  month?: string;
  page?: string;
  limit?: string;
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // デフォルト値の設定
  const gender = searchParams.gender || 'male';
  const type = searchParams.type || 'singles';
  const ageGroup = searchParams.ageGroup || '45';
  const page = parseInt(searchParams.page || '1');
  const limitParam = searchParams.limit || '100';
  const limit = limitParam === 'all' ? 999999 : parseInt(limitParam);

  // 最新の年月を取得（未指定の場合）
  let year = searchParams.year;
  let month = searchParams.month;

  if (!year || !month) {
    const latestRanking = await prisma.ranking.findFirst({
      orderBy: { rankingDate: 'desc' },
      select: { rankingDate: true },
    });

    if (latestRanking) {
      const date = new Date(latestRanking.rankingDate);
      year = year || date.getFullYear().toString();
      month = month || (date.getMonth() + 1).toString();
    } else {
      // ランキングデータがない場合のフォールバック
      const now = new Date();
      year = year || now.getFullYear().toString();
      month = month || (now.getMonth() + 1).toString();
    }
  }

  // ランキングデータの取得
  const getRankings = async () => {
    // 指定された年月の開始日と終了日を計算
    const startDate = new Date(parseInt(year!), parseInt(month!) - 1, 1);
    const endDate = new Date(parseInt(year!), parseInt(month!), 0, 23, 59, 59, 999);

    const [rankings, total] = await Promise.all([
      prisma.ranking.findMany({
        where: {
          gender: gender as 'male' | 'female',
          type: type as 'singles' | 'doubles',
          ageGroup: parseInt(ageGroup),
          rankingDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          player: true,
        },
        orderBy: {
          rankPosition: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ranking.count({
        where: {
          gender: gender as 'male' | 'female',
          type: type as 'singles' | 'doubles',
          ageGroup: parseInt(ageGroup),
          rankingDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    return { rankings, total };
  };

  // 利用可能な年月リストを取得
  const getAvailablePeriods = async () => {
    const rankings = await prisma.ranking.findMany({
      select: {
        rankingDate: true,
      },
      distinct: ['rankingDate'],
      orderBy: {
        rankingDate: 'desc',
      },
    });

    // 重複を除いて年月でグループ化
    const periodMap = new Map<string, Date>();
    rankings.forEach((r) => {
      const date = new Date(r.rankingDate);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!periodMap.has(key)) {
        periodMap.set(key, date);
      }
    });

    return Array.from(periodMap.entries()).map(([_, date]) => ({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: `${date.getFullYear()}年${date.getMonth() + 1}月`,
    }));
  };

  const availablePeriods = await getAvailablePeriods();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">JTAベテランランキング</h1>

      {/* フィルター部分 */}
      <RankingsFilter
        categories={CATEGORIES}
        availablePeriods={availablePeriods}
        currentFilters={{
          gender,
          type,
          ageGroup,
          year: year!,
          month: month!,
        }}
      />

      {/* ランキング表示部分 */}
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">読み込み中...</div>
          </div>
        }
      >
        <RankingsTableWrapper
          getRankings={getRankings}
          page={page}
          limit={limit}
          limitParam={limitParam}
          filters={{
            gender,
            type,
            ageGroup,
            year: year!,
            month: month!,
          }}
        />
      </Suspense>
    </div>
  );
}

// データフェッチを分離したラッパーコンポーネント
async function RankingsTableWrapper({
  getRankings,
  page,
  limit,
  limitParam,
  filters,
}: {
  getRankings: () => Promise<{ rankings: any[]; total: number }>;
  page: number;
  limit: number;
  limitParam: string;
  filters: any;
}) {
  const { rankings, total } = await getRankings();

  return (
    <RankingsTable
      rankings={rankings}
      total={total}
      page={page}
      limit={limit}
      limitParam={limitParam}
      filters={filters}
    />
  );
}