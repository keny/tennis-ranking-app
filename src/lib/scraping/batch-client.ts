// src/lib/scraping/batch-client.ts

import { CategoryCode, generateArchivePeriods, CATEGORIES } from './archive-utils'

interface BatchItem {
  year: number
  month: number
  categoryCode: CategoryCode
}

interface BatchProgress {
  total: number
  processed: number
  successful: number
  failed: number
  currentItem?: string
  errors: string[]
}

export class BatchScrapingClient {
  private queue: BatchItem[] = []
  private isRunning = false
  private abortController?: AbortController
  
  constructor(
    private onProgress?: (progress: BatchProgress) => void,
    private delayMs: number = 1000,
    private batchSize: number = 100
  ) {}

  // キューを生成
  generateQueue(
    startYear: number, 
    startMonth: number, 
    endYear?: number, 
    endMonth?: number
  ): void {
    const periods = generateArchivePeriods(startYear, startMonth).filter(period => {
      if (endYear && endMonth) {
        if (period.year > endYear || 
            (period.year === endYear && period.month > endMonth)) {
          return false
        }
      }
      return true
    })

    this.queue = []
    const categoryList = Object.keys(CATEGORIES) as CategoryCode[]

    for (const period of periods) {
      for (const categoryCode of categoryList) {
        this.queue.push({
          year: period.year,
          month: period.month,
          categoryCode
        })
      }
    }
  }

  // バッチ処理を開始
  async start(skipExisting: boolean = false): Promise<void> {
    if (this.isRunning) {
      throw new Error('Batch processing is already running')
    }

    this.isRunning = true
    this.abortController = new AbortController()

    const progress: BatchProgress = {
      total: this.queue.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    }

    try {
      // 既存データをチェック（オプション）
      if (skipExisting) {
        const existingCheck = await this.checkExistingData()
        this.queue = this.queue.filter(item => 
          !existingCheck.has(`${item.year}-${item.month}-${item.categoryCode}`)
        )
        progress.total = this.queue.length
      }

      // キューを処理
      for (const item of this.queue) {
        if (this.abortController.signal.aborted) {
          break
        }

        progress.currentItem = `${item.year}年${item.month}月 - ${CATEGORIES[item.categoryCode].displayName}`
        this.onProgress?.(progress)

        try {
          const result = await this.processItem(item)
          progress.processed++
          
          if (result.success) {
            progress.successful++
          } else {
            progress.failed++
            progress.errors.push(`${item.year}/${item.month} - ${item.categoryCode}: ${result.error}`)
          }
        } catch (error) {
          progress.processed++
          progress.failed++
          progress.errors.push(`${item.year}/${item.month} - ${item.categoryCode}: ${error}`)
        }

        // レート制限
        await this.delay(this.delayMs)

        // バッチサイズごとに長めの休憩
        if (progress.processed % this.batchSize === 0) {
          await this.delay(5000)
        }
      }
    } finally {
      this.isRunning = false
      this.onProgress?.(progress)
    }
  }

  // 処理を停止
  stop(): void {
    this.abortController?.abort()
  }

  // 単一アイテムを処理
  private async processItem(item: BatchItem): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('/api/admin/scraping/archive/single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: item.year,
        month: item.month,
        categoryCode: item.categoryCode
      }),
      signal: this.abortController?.signal
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    const data = await response.json()
    return { success: data.success, error: data.error }
  }

  // 既存データをチェック
  private async checkExistingData(): Promise<Set<string>> {
    const response = await fetch('/api/admin/scraping/history?limit=10000')
    const data = await response.json()
    
    const existing = new Set<string>()
    data.logs?.forEach((log: any) => {
      if (log.success && log.totalRecords > 0) {
        const date = new Date(log.rankingDate)
        const key = `${date.getFullYear()}-${date.getMonth() + 1}-${log.categoryCode}`
        existing.add(key)
      }
    })
    
    return existing
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}