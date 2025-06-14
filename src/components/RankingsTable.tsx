'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface Player {
  id: number;
  registrationNo: string;
  name: string;
  club: string | null;
  prefecture: string | null;
}

interface Ranking {
  id: number;
  rankPosition: number;
  playerId: number;
  player: Player;
  totalPoints: number;
  calcPoints: number;
  categoryCode: string;
  gender: string;
  type: string;
  ageGroup: number;
  rankingDate: string;
  isTied: boolean;
}

interface RankingsTableProps {
  rankings: Ranking[];
  total: number;
  page: number;
  limit: number;
  limitParam?: string;
  filters: {
    gender: string;
    type: string;
    ageGroup: string;
    year: string;
    month: string;
  };
}

export default function RankingsTable({
  rankings,
  total,
  page,
  limit,
  limitParam,
  filters,
}: RankingsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const totalPages = limitParam === 'all' ? 1 : Math.ceil(total / limit);

  const createPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      params.set(key, value);
    });
    params.set('page', pageNum.toString());
    params.set('limit', limitParam || '100');
    return `${pathname}?${params.toString()}`;
  };

  const getCategoryDisplay = () => {
    const genderMap: Record<string, string> = { male: '男子', female: '女子' };
    const typeMap: Record<string, string> = { singles: 'シングルス', doubles: 'ダブルス' };
    
    return `${genderMap[filters.gender]} ${typeMap[filters.type]} ${filters.ageGroup}歳以上`;
  };

  if (rankings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">
          {filters.year}年{filters.month}月の{getCategoryDisplay()}のランキングデータがありません。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* ヘッダー情報 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {filters.year}年{filters.month}月 {getCategoryDisplay()}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          全{total}名 ({page}ページ目)
        </p>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                順位
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                登録番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                選手名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                所属
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                都道府県
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                ポイント
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                計算ポイント
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rankings.map((ranking) => (
              <tr
                key={ranking.id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <span className="flex items-center">
                    {ranking.rankPosition}
                    {ranking.isTied && (
                      <span className="ml-1 text-xs text-gray-500">T</span>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ranking.player.registrationNo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Link
                    href={`/players/${ranking.playerId}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {ranking.player.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="max-w-xs truncate" title={ranking.player.club || '-'}>
                    {ranking.player.club || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ranking.player.prefecture || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {ranking.totalPoints.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {ranking.calcPoints.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページネーション - 全て表示の場合は非表示 */}
      {totalPages > 1 && limitParam !== 'all' && (
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => router.push(createPageUrl(page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            <button
              onClick={() => router.push(createPageUrl(page + 1))}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                全<span className="font-medium">{total}</span>件中{' '}
                <span className="font-medium">{(page - 1) * limit + 1}</span> -{' '}
                <span className="font-medium">
                  {Math.min(page * limit, total)}
                </span>{' '}
                件を表示
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                {/* 最初のページ */}
                {page > 2 && (
                  <>
                    <Link
                      href={createPageUrl(1)}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      1
                    </Link>
                    {page > 3 && (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    )}
                  </>
                )}

                {/* 前のページ */}
                {page > 1 && (
                  <Link
                    href={createPageUrl(page - 1)}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    {page - 1}
                  </Link>
                )}

                {/* 現在のページ */}
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                  {page}
                </span>

                {/* 次のページ */}
                {page < totalPages && (
                  <Link
                    href={createPageUrl(page + 1)}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    {page + 1}
                  </Link>
                )}

                {/* 最後のページ */}
                {page < totalPages - 1 && (
                  <>
                    {page < totalPages - 2 && (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    )}
                    <Link
                      href={createPageUrl(totalPages)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      {totalPages}
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}