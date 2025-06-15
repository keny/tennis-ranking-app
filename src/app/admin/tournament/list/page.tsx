// src/app/admin/tournament/list/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, Users, ChevronRight, FileText } from 'lucide-react';

interface Tournament {
  id: number;
  name: string;
  year: number;
  round?: number;
  venue?: string;
  createdAt: string;
  _count: {
    categories: number;
  };
}

export default function TournamentListPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchTournaments();
  }, [year]);

  const fetchTournaments = async () => {
    try {
      const params = new URLSearchParams();
      if (year !== 'all') {
        params.append('year', year.toString());
      }

      const response = await fetch(`/api/admin/tournament/list?${params.toString()}`);
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  // 年の選択肢を生成（現在年から過去10年分）
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">大会結果一覧</h1>
        <Link
          href="/admin/tournament"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <FileText className="h-4 w-4 mr-2" />
          PDFアップロード
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
            年度でフィルター
          </label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">すべて</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              大会データがありません
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/admin/tournament/${tournament.id}`}
                className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {tournament.name}
                    </h3>
                    {tournament.round && (
                      <p className="text-xs text-gray-500 mt-1">
                        第{tournament.round}回大会
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {tournament.year}年
                      </div>
                      {tournament.venue && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Trophy className="h-3 w-3 mr-1" />
                          {tournament.venue}
                        </div>
                      )}
                      <div className="flex items-center text-xs text-gray-600">
                        <Users className="h-3 w-3 mr-1" />
                        {tournament._count.categories}カテゴリー
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}