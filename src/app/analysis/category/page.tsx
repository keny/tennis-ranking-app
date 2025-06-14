import { prisma } from '@/lib/prisma';
import CategoryRankingFlow from '@/components/CategoryRankingFlow';
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

export default async function CategoryAnalysisPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // デフォルト値の設定
  const gender = searchParams.gender || 'male';
  const type = searchParams.type || 'singles';
  const ageGroup = searchParams.ageGroup || '45';

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
  const endYear = searchParams.endYear || latestPeriod?.year.toString();
  const endMonth = searchParams.endMonth || latestPeriod?.month.toString();
  
  const defaultStartDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 11); // 12ヶ月前
  
  const startYear = searchParams.startYear || defaultStartDate.getFullYear().toString();
  const startMonth = searchParams.startMonth || (defaultStartDate.getMonth() + 1).toString();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">カテゴリ別ランキング分析</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">分析条件</h2>
        
        <form method="get" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* カテゴリ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              性別
            </label>
            <select
              name="gender"
              defaultValue={gender}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(CATEGORIES.gender).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              種目
            </label>
            <select
              name="type"
              defaultValue={type}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(CATEGORIES.type).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              年齢カテゴリ
            </label>
            <select
              name="ageGroup"
              defaultValue={ageGroup}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(CATEGORIES.ageGroup).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* 期間選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              開始年月
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="startYear"
                defaultValue={startYear}
                min="2004"
                max={new Date().getFullYear()}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                name="startMonth"
                defaultValue={startMonth}
                min="1"
                max="12"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              終了年月
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="endYear"
                defaultValue={endYear}
                min="2004"
                max={new Date().getFullYear()}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                name="endMonth"
                defaultValue={endMonth}
                min="1"
                max="12"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              分析実行
            </button>
          </div>
        </form>
      </div>

      {/* ランキング推移表示 */}
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
    </div>
  );
}

// データフェッチを分離したラッパーコンポーネント
async function CategoryRankingFlowWrapper({
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