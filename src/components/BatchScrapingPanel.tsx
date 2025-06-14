// src/components/BatchScrapingPanel.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { BatchScrapingClient } from '@/lib/scraping/batch-client'

interface BatchProgress {
  total: number
  processed: number
  successful: number
  failed: number
  currentItem?: string
  errors: string[]
}

export default function BatchScrapingPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  })
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2025')
  const [skipExisting, setSkipExisting] = useState(true)
  const [showErrors, setShowErrors] = useState(false)
  
  const clientRef = useRef<BatchScrapingClient | null>(null)

  // 期間オプション
  const periodOptions = [
    { value: '2025', label: '2025年', start: { year: 2025, month: 1 }, end: { year: 2025, month: 12 } },
    { value: '2024', label: '2024年', start: { year: 2024, month: 1 }, end: { year: 2024, month: 12 } },
    { value: '2023', label: '2023年', start: { year: 2023, month: 1 }, end: { year: 2023, month: 12 } },
    { value: '2020-2022', label: '2020-2022年', start: { year: 2020, month: 1 }, end: { year: 2022, month: 12 } },
    { value: '2015-2019', label: '2015-2019年', start: { year: 2015, month: 1 }, end: { year: 2019, month: 12 } },
    { value: '2010-2014', label: '2010-2014年', start: { year: 2010, month: 1 }, end: { year: 2014, month: 12 } },
    { value: '2004-2009', label: '2004-2009年', start: { year: 2004, month: 1 }, end: { year: 2009, month: 12 } },
    { value: 'custom', label: 'カスタム期間' }
  ]

  const startBatch = async () => {
    const selected = periodOptions.find(p => p.value === selectedPeriod)
    if (!selected || selected.value === 'custom') {
      alert('期間を選択してください')
      return
    }

    setIsRunning(true)
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    })

    // バッチクライアントを作成
    clientRef.current = new BatchScrapingClient(
      (progress) => setProgress({ ...progress }),
      1000, // 1秒間隔
      100   // 100件ごとに休憩
    )

    // キューを生成
    clientRef.current.generateQueue(
      selected.start.year,
      selected.start.month,
      selected.end?.year,
      selected.end?.month
    )

    try {
      await clientRef.current.start(skipExisting)
    } catch (error) {
      console.error('Batch processing error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const stopBatch = () => {
    clientRef.current?.stop()
    setIsRunning(false)
  }

  // 進捗率を計算
  const progressPercentage = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0

  // 残り時間を推定（簡易版）
  const estimatedTimeRemaining = () => {
    if (progress.processed === 0 || !isRunning) return ''
    const remaining = progress.total - progress.processed
    const secondsPerItem = 1.1 // 1秒 + バッファ
    const totalSeconds = remaining * secondsPerItem
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return `約${hours > 0 ? `${hours}時間` : ''}${minutes}分`
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">バッチスクレイピング</h2>
      
      {/* 期間選択 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">処理期間</label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          disabled={isRunning}
          className="w-full px-3 py-2 border rounded-lg"
        >
          {periodOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* オプション */}
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={skipExisting}
            onChange={(e) => setSkipExisting(e.target.checked)}
            disabled={isRunning}
            className="mr-2"
          />
          <span className="text-sm">既存データをスキップ（推奨）</span>
        </label>
      </div>

      {/* 実行ボタン */}
      <div className="mb-6">
        {!isRunning ? (
          <button
            onClick={startBatch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            バッチ処理を開始
          </button>
        ) : (
          <button
            onClick={stopBatch}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            処理を停止
          </button>
        )}
      </div>

      {/* 進捗表示 */}
      {(isRunning || progress.processed > 0) && (
        <div className="space-y-4">
          {/* プログレスバー */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{progress.processed} / {progress.total}</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{progress.successful}</div>
              <div className="text-gray-600">成功</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
              <div className="text-gray-600">失敗</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{estimatedTimeRemaining()}</div>
              <div className="text-gray-600">残り時間</div>
            </div>
          </div>

          {/* 現在の処理 */}
          {progress.currentItem && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">処理中:</span> {progress.currentItem}
            </div>
          )}

          {/* エラー表示 */}
          {progress.errors.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="text-sm text-blue-600 hover:underline"
              >
                エラー詳細 ({progress.errors.length}件) {showErrors ? '▼' : '▶'}
              </button>
              {showErrors && (
                <div className="mt-2 max-h-40 overflow-y-auto bg-gray-50 p-2 rounded text-xs">
                  {progress.errors.slice(-10).map((error, index) => (
                    <div key={index} className="text-red-600 py-1">
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}