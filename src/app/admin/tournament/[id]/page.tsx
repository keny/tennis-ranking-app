// src/app/admin/tournament/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Users, ChevronLeft, Medal, Swords } from 'lucide-react';

interface TournamentDetail {
  id: number;
  name: string;
  year: number;
  round?: number;
  venue?: string;
  categories: Array<{
    id: number;
    categoryCode: string;
    gender: string;
    type: string;
    ageGroup: number;
    drawSize: number;
    results: Array<{
      id: number;
      finalPosition: string;
      rankOrder: number;
      player: {
        id: number;
        name: string;
        registrationNo: string;
      };
      partnerName?: string;
    }>;
    _count: {
      matches: number;
    };
  }>;
}

export default function TournamentDetailPage() {
  const params = useParams();
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all' | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchTournamentDetail();
    }
  }, [params.id]);

  const fetchTournamentDetail = async () => {
    try {
      const response = await fetch(`/api/admin/tournament/${params.id}`);
      const data = await response.json();
      setTournament(data);
      // デフォルトで「全て表示」を選択
      setSelectedCategory('all');
    } catch (error) {
      console.error('Error fetching tournament detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (category: any) => {
    const genderName = category.gender === 'male' ? '男子' : '女子';
    const typeName = category.type === 'singles' ? 'シングルス' : 'ダブルス';
    return `${genderName}${typeName}${category.ageGroup}歳以上`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">大会データが見つかりません</p>
        </div>
      </div>
    );
  }

  const selectedCategoryData = selectedCategory !== 'all' 
    ? tournament.categories.find(c => c.id === selectedCategory)
    : null;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/admin/tournament/list"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          大会一覧に戻る
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{tournament.name}</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {tournament.round && <span>第{tournament.round}回大会</span>}
          <span>{tournament.year}年</span>
          {tournament.venue && <span>{tournament.venue}</span>}
          <span>{tournament.categories.length}カテゴリー</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">カテゴリー</h2>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">全カテゴリー</div>
                <div className="text-xs text-gray-500">
                  全ての結果を表示
                </div>
              </button>
              {tournament.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{getCategoryName(category)}</div>
                  <div className="text-xs text-gray-500">
                    {category.drawSize}ドロー・{category._count.matches}試合
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedCategory === 'all' ? (
            // 全カテゴリーの結果を表示
            <div className="space-y-6">
              {tournament.categories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    {getCategoryName(category)} - 最終成績
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-sm text-gray-600">
                      {category.drawSize}ドロー・{category._count.matches}試合
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {category.results
                      .sort((a, b) => a.rankOrder - b.rankOrder)
                      .slice(0, 8) // Top 8のみ表示
                      .map((result) => (
                        <div
                          key={result.id}
                          className={`p-2 rounded-lg border ${
                            result.rankOrder === 1
                              ? 'bg-yellow-50 border-yellow-200'
                              : result.rankOrder === 2
                              ? 'bg-gray-50 border-gray-200'
                              : result.rankOrder <= 4
                              ? 'bg-orange-50 border-orange-200'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {result.rankOrder === 1 && (
                                <Medal className="h-4 w-4 text-yellow-600 mr-2" />
                              )}
                              {result.rankOrder === 2 && (
                                <Medal className="h-4 w-4 text-gray-600 mr-2" />
                              )}
                              {result.rankOrder <= 4 && result.rankOrder > 2 && (
                                <Medal className="h-4 w-4 text-orange-600 mr-2" />
                              )}
                              <div>
                                <div className="text-sm font-medium">
                                  {result.player.name}
                                  {result.partnerName && ` / ${result.partnerName}`}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {result.player.registrationNo}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{result.finalPosition}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Link
                      href={`/admin/tournament/${tournament.id}/category/${category.id}/matches`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Swords className="h-4 w-4 mr-1" />
                      全試合結果を見る
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedCategoryData ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                {getCategoryName(selectedCategoryData)} - 最終成績
              </h2>

              <div className="space-y-3">
                {selectedCategoryData.results
                  .sort((a, b) => a.rankOrder - b.rankOrder)
                  .map((result) => (
                    <div
                      key={result.id}
                      className={`p-3 rounded-lg border ${
                        result.rankOrder === 1
                          ? 'bg-yellow-50 border-yellow-200'
                          : result.rankOrder === 2
                          ? 'bg-gray-50 border-gray-200'
                          : result.rankOrder <= 4
                          ? 'bg-orange-50 border-orange-200'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {result.rankOrder === 1 && (
                            <Medal className="h-5 w-5 text-yellow-600 mr-2" />
                          )}
                          {result.rankOrder === 2 && (
                            <Medal className="h-5 w-5 text-gray-600 mr-2" />
                          )}
                          {result.rankOrder <= 4 && result.rankOrder > 2 && (
                            <Medal className="h-5 w-5 text-orange-600 mr-2" />
                          )}
                          <div>
                            <div className="font-medium">
                              {result.player.name}
                              {result.partnerName && ` / ${result.partnerName}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.player.registrationNo}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{result.finalPosition}</div>
                          <div className="text-xs text-gray-500">
                            {result.rankOrder}位
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <Link
                  href={`/admin/tournament/${tournament.id}/category/${selectedCategoryData.id}/matches`}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Swords className="h-4 w-4 mr-1" />
                  全試合結果を見る
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}