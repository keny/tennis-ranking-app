// app/admin/scraping/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { CategoryCode } from '@/lib/scraping/archive-utils'
import BatchScrapingPanel from '@/components/BatchScrapingPanel'

interface ScrapingStats {
  totalPlayers: number
  totalRankings: number
  totalScrapingLogs: number
  successfulScrapings: number
  failedScrapings: number
  successRate: string
  processedPeriods: number
  totalPeriods: number
  completionRate: string
  lastScrapingDate: string | null
}

interface Category {
  code: string
  gender: string
  type: string
  ageGroup: number
  displayName: string
}

interface Period {
  year: number
  month: number
  displayName: string
  isProcessed: boolean
  processedCategories: number
  totalCategories: number
  completionRate: number
}

export default function ScrapingAdminPage() {
  const [stats, setStats] = useState<ScrapingStats | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchStats()
    fetchCategories()
    fetchPeriods()
    
    // 定期的に統計情報を更新（10秒ごと）
    const interval = setInterval(() => {
      fetchStats()
      fetchPeriods()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/scraping/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/scraping/categories')
      const data = await res.json()
      setCategories(data.categories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchPeriods = async () => {
    try {
      const res = await fetch('/api/admin/scraping/periods')
      const data = await res.json()
      setPeriods(data.periods)
    } catch (error) {
      console.error('Failed to fetch periods:', error)
    }
  }

  const scrapeLatest = async (all: boolean = false) => {
    setIsLoading(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/admin/scraping/latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryCode: all ? null : selectedCategory,
          all
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: '最新ランキングの取得に成功しました' })
        // 統計情報と期間情報を更新
        await fetchStats()
        await fetchPeriods()
      } else {
        setMessage({ type: 'error', text: data.error || '取得に失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生しました' })
    } finally {
      setIsLoading(false)
    }
  }

  const scrapeArchive = async (all: boolean = false) => {
    setIsLoading(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/admin/scraping/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          categoryCode: all ? null : selectedCategory
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'アーカイブの取得に成功しました' })
        // 統計情報と期間情報を更新
        await fetchStats()
        await fetchPeriods()
      } else {
        setMessage({ type: 'error', text: data.error || '取得に失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生しました' })
    } finally {
      setIsLoading(false)
    }
  }

  const scrapeAllArchives = async () => {
    const startYear = parseInt(prompt('開始年を入力してください（例: 2004）', '2004') || '2004')
    const skipExisting = confirm('既存データをスキップしますか？（推奨）')
    
    if (!confirm(`${startYear}年から現在までの全アーカイブを取得します。長時間かかります。実行しますか？`)) {
      return
    }
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/admin/scraping/archive/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startYear,
          startMonth: 1,
          batchSize: 100,
          skipExisting
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `バックグラウンドで処理を開始しました（${startYear}年〜現在）` 
        })
      } else {
        setMessage({ type: 'error', text: data.error || '開始に失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生しました' })
    } finally {
      setIsLoading(false)
    }
  }

  const scrapeArchivesByDecade = async (startYear: number, endYear: number) => {
    const skipExisting = confirm('既存データをスキップしますか？（推奨）')
    
    if (!confirm(`${startYear}年から${endYear}年のアーカイブを取得します。実行しますか？`)) {
      return
    }
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/admin/scraping/archive/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startYear,
          startMonth: 1,
          endYear,
          endMonth: 12,
          batchSize: 100,
          skipExisting
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `バックグラウンドで処理を開始しました（${startYear}年〜${endYear}年）` 
        })
        // 統計情報を更新
        setTimeout(() => {
          fetchStats()
          fetchPeriods()
        }, 3000)
      } else {
        setMessage({ type: 'error', text: data.error || '開始に失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生しました' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">スクレイピング管理</h1>

      {/* 統計情報 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">選手数</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalPlayers.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">ランキング記録数</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalRankings.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">処理完了率</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.completionRate}</p>
            <p className="text-sm text-gray-600">{stats.processedPeriods}/{stats.totalPeriods} 期間</p>
          </div>
        </div>
      )}

      {/* メッセージ表示 */}
      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* 最新ランキング取得 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">最新ランキング取得</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">カテゴリ</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={isLoading}
            >
              <option value="">カテゴリを選択</option>
              {categories.map(cat => (
                <option key={cat.code} value={cat.code}>
                  {cat.displayName}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => scrapeLatest(false)}
            disabled={isLoading || !selectedCategory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            取得
          </button>
          <button
            onClick={() => scrapeLatest(true)}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            全カテゴリ取得
          </button>
        </div>
      </div>

      {/* バッチスクレイピングパネル */}
      <div className="mb-6">
        <BatchScrapingPanel />
      </div>

      {/* アーカイブ取得 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">アーカイブ取得</h2>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">年</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg"
              disabled={isLoading}
            >
              {Array.from({ length: new Date().getFullYear() - 2003 }, (_, i) => 2004 + i).map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">月</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg"
              disabled={isLoading}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{month}月</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">カテゴリ</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={isLoading}
            >
              <option value="">全カテゴリ</option>
              {categories.map(cat => (
                <option key={cat.code} value={cat.code}>
                  {cat.displayName}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => scrapeArchive(selectedCategory === '')}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            取得
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={scrapeAllArchives}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            全アーカイブ一括取得
          </button>
          <span className="text-sm text-gray-600 ml-2">
            （2004年以降の全データ）
          </span>
          <button
            onClick={() => {
              fetchStats()
              fetchPeriods()
            }}
            disabled={isLoading}
            className="ml-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            更新
          </button>
        </div>
        
        {/* 年代別一括取得ボタン */}
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">年代別一括取得：</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => scrapeArchivesByDecade(2004, 2009)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              2004-2009年
            </button>
            <button
              onClick={() => scrapeArchivesByDecade(2010, 2019)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              2010-2019年
            </button>
            <button
              onClick={() => scrapeArchivesByDecade(2020, new Date().getFullYear())}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              2020年-現在
            </button>
          </div>
        </div>
      </div>

      {/* 期間別処理状況 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">期間別処理状況</h2>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">期間</th>
                <th className="px-4 py-2 text-center">状態</th>
                <th className="px-4 py-2 text-center">進捗</th>
                <th className="px-4 py-2 text-right">完了率</th>
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={`${period.year}-${period.month}`} className="border-t">
                  <td className="px-4 py-2">{period.displayName}</td>
                  <td className="px-4 py-2 text-center">
                    {period.isProcessed ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">完了</span>
                    ) : period.processedCategories > 0 ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">処理中</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">未処理</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {period.processedCategories}/{period.totalCategories}
                  </td>
                  <td className="px-4 py-2 text-right">{period.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}