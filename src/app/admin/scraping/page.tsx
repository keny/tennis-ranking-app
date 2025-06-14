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
    total: number;
    categories: Array<{
      gender: string;
      type: string;
      ageGroup: number;
      count: number;
    }>;
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

      {/* アーカイブデータ取得 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">アーカイブデータ取得</h2>
        <p className="text-gray-600 mb-4">
          特定期間のランキングデータを取得します
        </p>
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const year = formData.get('year') as string;
          const month = formData.get('month') as string;
          const category = formData.get('category') as string;
          const ageGroup = formData.get('ageGroup') as string;
          
          if (!year || !month) {
            alert('年月を選択してください');
            return;
          }
          
          setScraping(true);
          setResult(null);
          
          try {
            const body: any = {
              year: parseInt(year),
              month: parseInt(month),
            };
            
            // カテゴリが指定されている場合は性別と種目を設定
            if (category && category !== 'all') {
              const [gender, type] = category.split('-');
              body.gender = gender;
              body.type = type;
            }
            
            // 年齢が指定されている場合
            if (ageGroup && ageGroup !== 'all') {
              body.ageGroup = parseInt(ageGroup);
            }
            
            const response = await fetch('/api/admin/scraping/archive', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(body),
            });
            
            const data = await response.json();
            setResult(data);
            
            if (data.success) {
              await fetchStats();
            }
          } catch (error) {
            setResult({
              success: false,
              message: 'アーカイブ取得中にエラーが発生しました',
            });
          } finally {
            setScraping(false);
          }
        }} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年
              </label>
              <select
                name="year"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                defaultValue=""
              >
                <option value="">選択してください</option>
                {Array.from({ length: new Date().getFullYear() - 2003 }, (_, i) => 2004 + i).reverse().map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                月
              </label>
              <select
                name="month"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                defaultValue=""
              >
                <option value="">選択してください</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ（オプション）
              </label>
              <select
                name="category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                defaultValue="all"
              >
                <option value="all">全て</option>
                <option value="male-singles">男S</option>
                <option value="male-doubles">男D</option>
                <option value="female-singles">女S</option>
                <option value="female-doubles">女D</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年齢（オプション）
              </label>
              <select
                name="ageGroup"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                defaultValue="all"
              >
                <option value="all">全て</option>
                {[35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85].map(age => (
                  <option key={age} value={age}>{age}歳以上</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={scraping}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {scraping ? '取得中...' : 'アーカイブ取得'}
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                const form = e.currentTarget.closest('form') as HTMLFormElement;
                const categorySelect = form.querySelector('select[name="category"]') as HTMLSelectElement;
                const ageGroupSelect = form.querySelector('select[name="ageGroup"]') as HTMLSelectElement;
                
                categorySelect.value = 'all';
                ageGroupSelect.value = 'all';
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              カテゴリをリセット
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>※ カテゴリを指定しない場合は、選択した年月の全カテゴリを取得します</p>
            <p>※ 特定のカテゴリのみ再取得したい場合に使用してください</p>
          </div>
        </form>
      </div>

      {/* バッチスクレイピング */}
      <BatchScrapingPanel onComplete={fetchStats} />

      {/* 期間別データ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">期間別・カテゴリ別データ数</h2>
        <div className="max-h-96 overflow-y-auto">
          {stats?.periodCounts?.map((period) => (
            <details key={`${period.year}-${period.month}`} className="mb-4 border-b pb-4">
              <summary className="cursor-pointer hover:bg-gray-50 p-2 rounded">
                <span className="font-medium">
                  {period.year}年{period.month}月
                </span>
                <span className="ml-2 text-gray-600">
                  (合計: {(period.total || period.categories?.reduce((sum, cat) => sum + cat.count, 0) || 0).toLocaleString()}件)
                </span>
                {period.categories && period.categories.length < 44 && (
                  <span className="ml-2 text-yellow-600 text-sm">
                    ※ {44 - period.categories.length}カテゴリ不足
                  </span>
                )}
              </summary>
              <div className="mt-2 ml-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {[35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85].map(ageGroup => {
                    const genderTypeMap = [
                      { gender: 'male', type: 'singles', label: '男S' },
                      { gender: 'male', type: 'doubles', label: '男D' },
                      { gender: 'female', type: 'singles', label: '女S' },
                      { gender: 'female', type: 'doubles', label: '女D' },
                    ];
                    
                    return (
                      <div key={ageGroup} className="border rounded p-2">
                        <div className="font-medium mb-1">{ageGroup}歳以上</div>
                        <div className="grid grid-cols-4 gap-1">
                          {genderTypeMap.map(({ gender, type, label }) => {
                            const category = period.categories.find(
                              c => c.gender === gender && c.type === type && c.ageGroup === ageGroup
                            );
                            return (
                              <div
                                key={`${gender}-${type}`}
                                className={`text-center p-1 rounded ${
                                  category 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                <div className="text-xs font-medium">{label}</div>
                                <div className="text-xs">
                                  {category ? category.count : '✗'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </details>
          )) || (
            <div className="text-center text-sm text-gray-500">
              データがありません
            </div>
          )}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>※ 各カテゴリは全44種類（男女 × シングルス/ダブルス × 11年齢区分）</p>
          <p>※ 緑色：データあり、赤色：データなし</p>
        </div>
      </div>
    </div>
  );
}