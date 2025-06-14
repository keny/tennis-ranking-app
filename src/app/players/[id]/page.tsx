import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PlayerInfo from '@/components/PlayerInfo';
import RankingChart from '@/components/RankingChart';
import { Suspense } from 'react';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function PlayerPage({ params }: PageProps) {
  const playerId = parseInt(params.id);
  
  if (isNaN(playerId)) {
    notFound();
  }

  try {
    // 選手情報を取得
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      notFound();
    }

    // 選手のランキング履歴を取得
    const rankings = await prisma.ranking.findMany({
      where: { playerId },
      orderBy: { rankingDate: 'asc' },
    });

    // カテゴリ別にランキングをグループ化
    const rankingsByCategory = rankings.reduce((acc, ranking) => {
      const categoryKey = `${ranking.gender}_${ranking.type}_${ranking.ageGroup}`;
      if (!acc[categoryKey]) {
        acc[categoryKey] = {
          gender: ranking.gender,
          type: ranking.type,
          ageGroup: ranking.ageGroup,
          categoryCode: ranking.categoryCode,
          rankings: [],
        };
      }
      acc[categoryKey].rankings.push(ranking);
      return acc;
    }, {} as Record<string, any>);

    // 最新のランキング情報を取得
    const latestRankings = rankings.length > 0 
      ? await prisma.ranking.findMany({
          where: {
            playerId,
            rankingDate: {
              equals: rankings[rankings.length - 1].rankingDate,
            },
          },
          orderBy: [
            { gender: 'asc' },
            { type: 'asc' },
            { ageGroup: 'asc' },
          ],
        })
      : [];

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {player.name}
          </h1>
          <p className="text-gray-600">
            登録番号: {player.registrationNo}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* プロフィール情報 */}
          <div className="lg:col-span-1">
            <PlayerInfo player={player} latestRankings={latestRankings} />
          </div>

          {/* ランキング推移グラフ */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">ランキング推移</h2>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center h-64">
                    <div className="text-lg">グラフを読み込み中...</div>
                  </div>
                }
              >
                <RankingChart rankingsByCategory={rankingsByCategory} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* カテゴリ別詳細テーブル */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">カテゴリ別ランキング履歴</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(rankingsByCategory).map(([key, category]: [string, any]) => (
              <CategoryRankingTable
                key={key}
                category={category}
              />
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('選手ページエラー:', error);
    notFound();
  }
}

// カテゴリ別ランキングテーブルコンポーネント
function CategoryRankingTable({ category }: { category: any }) {
  const genderMap: Record<string, string> = { male: '男子', female: '女子' };
  const typeMap: Record<string, string> = { singles: 'シングルス', doubles: 'ダブルス' };
  
  const categoryName = `${genderMap[category.gender]} ${typeMap[category.type]} ${category.ageGroup}歳以上`;
  
  // 最新5件のランキングを表示
  const recentRankings = category.rankings.slice(-5).reverse();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-3">{categoryName}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                年月
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                順位
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                ポイント
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentRankings.map((ranking: any) => {
              const date = new Date(ranking.rankingDate);
              const yearMonth = `${date.getFullYear()}年${date.getMonth() + 1}月`;
              
              return (
                <tr key={ranking.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {yearMonth}
                  </td>
                  <td className="px-4 py-2 text-sm text-center">
                    <span className="font-medium">
                      {ranking.rankPosition}
                      {ranking.isTied && <span className="text-xs text-gray-500 ml-1">T</span>}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900">
                    {ranking.totalPoints.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}