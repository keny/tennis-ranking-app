'use client';

import { useState, useEffect, useCallback } from 'react';
import BatchScrapingPanel from '@/components/BatchScrapingPanel';

interface Stats {
  totalPlayers: number;
  totalRankings: number;
  lastScrapingDate: string | null;
  periodCounts?: {
    year: number;
    month: number;
    count: number;
  }[];
}

interface ScrapingResult {
  success: boolean;
  message: string;
  details?: {
    newRankings: number;
    updatedPlayers: number;
    errors: number;
  };
}

export default function ScrapingAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/scraping/stats');
      if (!response.ok) {
        console.warn('Stats fetch failed:', response.status);
        return;
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.warn('Stats fetch error:', error);
      // エラーを無視して続行
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 初回読み込み
    fetchStats();

    // 自動更新の設定
    let interval: NodeJS.Timeout | null = null;

    const setupInterval = () => {
      if (autoRefresh && document.visibilityState === 'visible') {
        interval = setInterval(fetchStats, 10000);
      }
    };

    const handleVisibilityChange = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      if (document.visibilityState === 'visible' && autoRefresh) {
        fetchStats(); // ページがアクティブになったら即座に更新
        setupInterval();
      }
    };

    // 初期設定
    setupInterval();

    // ページの表示/非表示を監視
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStats, autoRefresh]);

  const handleScrapingLatest = async () => {
    setScraping(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/scraping/latest', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        await fetchStats();
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'スクレイピング中にエラーが発生しました',
      });
    } finally {
      setScraping(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">スクレイピング管理</h1>
        <p className="text-gray-600">JTAランキングデータの取得と管理</p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">総選手数</h2>
          <p className="text-3xl font-bold text-blue-600">
            {stats?.totalPlayers.toLocaleString() || 0}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">総ランキング数</h2>
          <p className="text-3xl font-bold text-green-600">
            {stats?.totalRankings.toLocaleString() || 0}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">最終更新</h2>
          <p className="text-lg font-medium text-gray-900">
            {stats?.lastScrapingDate 
              ? new Date(stats.lastScrapingDate).toLocaleString('ja-JP')
              : '未取得'}
          </p>
        </div>
      </div>

      {/* 自動更新の切り替え */}
      <div className="mb-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            10秒ごとに自動更新（ページがアクティブな時のみ）
          </span>
        </label>
      </div>

      {/* 最新データ取得 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">最新ランキング取得</h2>
        <p className="text-gray-600 mb-4">
          JTAサイトから最新のランキングデータを取得します
        </p>
        
        <button
          onClick={handleScrapingLatest}
          disabled={scraping}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {scraping ? '取得中...' : '最新データを取得'}
        </button>
        
        {result && (
          <div className={`mt-4 p-4 rounded ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <p className="font-medium">{result.message}</p>
            {result.details && (
              <div className="mt-2 text-sm">
                <p>新規ランキング: {result.details.newRankings}</p>
                <p>更新選手数: {result.details.updatedPlayers}</p>
                {result.details.errors > 0 && (
                  <p>エラー: {result.details.errors}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* バッチスクレイピング */}
      <BatchScrapingPanel onComplete={fetchStats} />

      {/* 期間別データ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">期間別データ数</h2>
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  年月
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  データ数
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.periodCounts?.map((period) => (
                <tr key={`${period.year}-${period.month}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {period.year}年{period.month}月
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {period.count.toLocaleString()}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                    データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}