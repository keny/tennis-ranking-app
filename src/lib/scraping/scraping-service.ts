// src/lib/scraping/scraping-service.ts

import { PrismaClient } from '@prisma/client'
import { 
  CategoryCode, 
  CATEGORIES, 
  generateArchiveUrl, 
  generateLatestUrl,
  generateArchivePeriods,
  ArchivePeriod,
  createBatches
} from './archive-utils'
import { 
  scrapeCategoryForPeriod, 
  scrapeRankingPage, 
  saveRankingData,
  ScrapingResult
} from './jta-scraper'

export interface ScrapingProgress {
  totalItems: number
  processedItems: number
  successfulItems: number
  failedItems: number
  currentItem?: string
  errors: Array<{ item: string; error: string }>
}

export type ProgressCallback = (progress: ScrapingProgress) => void

/**
 * 最新ランキングをスクレイピング（単一カテゴリ）
 */
export async function scrapeLatestRanking(
  prisma: PrismaClient,
  categoryCode: CategoryCode
): Promise<ScrapingResult> {
  const url = generateLatestUrl(categoryCode)
  const result = await scrapeRankingPage(url)
  
  if (result.success) {
    // スクレイピング結果からランキング日付を取得
    let rankingDate: Date
    
    if (result.rankingDate) {
      // ページから取得した日付を使用
      rankingDate = result.rankingDate
      console.log(`Using ranking date from page: ${rankingDate.toISOString().slice(0, 10)}`)
    } else {
      // 日付が取得できない場合は、前月末をデフォルトとして使用
      const now = new Date()
      rankingDate = new Date(now.getFullYear(), now.getMonth(), 0)
      console.warn(`Could not find ranking date on page, using default: ${rankingDate.toISOString().slice(0, 10)}`)
    }
    
    await saveRankingData(
      prisma,
      categoryCode,
      rankingDate,
      result,
      'latest'
    )
  }
  
  return result
}

/**
 * 最新ランキングをスクレイピング（全カテゴリ）
 */
export async function scrapeAllLatestRankings(
  prisma: PrismaClient,
  onProgress?: ProgressCallback
): Promise<Map<CategoryCode, ScrapingResult>> {
  const results = new Map<CategoryCode, ScrapingResult>()
  const categoryList = Object.keys(CATEGORIES) as CategoryCode[]
  
  const progress: ScrapingProgress = {
    totalItems: categoryList.length,
    processedItems: 0,
    successfulItems: 0,
    failedItems: 0,
    errors: []
  }
  
  for (const categoryCode of categoryList) {
    progress.currentItem = `${CATEGORIES[categoryCode].displayName}`
    onProgress?.(progress)
    
    const result = await scrapeLatestRanking(prisma, categoryCode)
    results.set(categoryCode, result)
    
    progress.processedItems++
    if (result.success) {
      progress.successfulItems++
    } else {
      progress.failedItems++
      progress.errors.push({
        item: categoryCode,
        error: result.error || 'Unknown error'
      })
    }
    
    // レート制限: 1秒待機
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  onProgress?.(progress)
  return results
}

/**
 * アーカイブデータをスクレイピング（特定期間・特定カテゴリ）
 */
export async function scrapeArchive(
  prisma: PrismaClient,
  year: number,
  month: number,
  categoryCode: CategoryCode
): Promise<ScrapingResult> {
  // 既に処理済みかチェック
  const alreadyProcessed = await isAlreadyProcessed(prisma, year, month, categoryCode)
  if (alreadyProcessed) {
    console.log(`Skipping already processed: ${year}/${month} - ${categoryCode}`)
    return {
      success: true,
      data: [],
      totalRecords: 0,
      error: 'Already processed'
    }
  }
  
  const period: ArchivePeriod = {
    year,
    month,
    urlPath: `${year}${month.toString().padStart(2, '0')}vet`,
    displayName: `${year}年${month}月`,
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 0)
  }
  
  const url = generateArchiveUrl(period, categoryCode)
  return await scrapeCategoryForPeriod(prisma, categoryCode, year, month, url)
}

/**
 * アーカイブデータをスクレイピング（特定期間・全カテゴリ）
 */
export async function scrapeArchivePeriod(
  prisma: PrismaClient,
  year: number,
  month: number,
  onProgress?: ProgressCallback
): Promise<Map<CategoryCode, ScrapingResult>> {
  const results = new Map<CategoryCode, ScrapingResult>()
  const categoryList = Object.keys(CATEGORIES) as CategoryCode[]
  
  const progress: ScrapingProgress = {
    totalItems: categoryList.length,
    processedItems: 0,
    successfulItems: 0,
    failedItems: 0,
    errors: []
  }
  
  for (const categoryCode of categoryList) {
    progress.currentItem = `${year}年${month}月 - ${CATEGORIES[categoryCode].displayName}`
    onProgress?.(progress)
    
    const result = await scrapeArchive(prisma, year, month, categoryCode)
    results.set(categoryCode, result)
    
    progress.processedItems++
    if (result.success) {
      progress.successfulItems++
    } else {
      progress.failedItems++
      progress.errors.push({
        item: `${year}/${month} - ${categoryCode}`,
        error: result.error || 'Unknown error'
      })
    }
    
    // レート制限: 1秒待機
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  onProgress?.(progress)
  return results
}

/**
 * 特定の期間・カテゴリが既に処理済みかチェック
 */
async function isAlreadyProcessed(
  prisma: PrismaClient,
  year: number,
  month: number,
  categoryCode: CategoryCode
): Promise<boolean> {
  // 該当する月の範囲を計算
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // 月末
  
  // スクレイピングログをチェック
  const existingLog = await prisma.scrapingLog.findFirst({
    where: {
      categoryCode,
      rankingDate: {
        gte: startDate,
        lte: endDate
      },
      success: true,
      dataSource: 'archive'
    }
  })
  
  return !!existingLog
}

/**
 * 全アーカイブデータをスクレイピング（重複チェック強化版）
 */
export async function scrapeAllArchives(
  prisma: PrismaClient,
  onProgress?: ProgressCallback,
  options?: {
    startYear?: number
    startMonth?: number
    endYear?: number
    endMonth?: number
    batchSize?: number
    skipExisting?: boolean
    forceReprocess?: boolean  // 強制的に再処理
  }
): Promise<void> {
  const periods = generateArchivePeriods(options?.startYear || 2004, options?.startMonth || 1).filter(period => {
    if (options?.endYear && options?.endMonth) {
      if (period.year > options.endYear || 
          (period.year === options.endYear && period.month > options.endMonth)) {
        return false
      }
    }
    return true
  })
  
  const categoryList = Object.keys(CATEGORIES) as CategoryCode[]
  let totalItems = periods.length * categoryList.length
  let skippedItems = 0
  
  // スキップ対象を事前にカウント（正確な進捗表示のため）
  if (options?.skipExisting && !options?.forceReprocess) {
    for (const period of periods) {
      for (const categoryCode of categoryList) {
        if (await isAlreadyProcessed(prisma, period.year, period.month, categoryCode)) {
          skippedItems++
        }
      }
    }
    console.log(`Skipping ${skippedItems} already processed items`)
  }
  
  const progress: ScrapingProgress = {
    totalItems: totalItems - skippedItems,
    processedItems: 0,
    successfulItems: 0,
    failedItems: 0,
    errors: []
  }
  
  for (const period of periods) {
    for (const categoryCode of categoryList) {
      // 既存データチェック
      if (options?.skipExisting && !options?.forceReprocess) {
        const alreadyProcessed = await isAlreadyProcessed(
          prisma, 
          period.year, 
          period.month, 
          categoryCode
        )
        
        if (alreadyProcessed) {
          console.log(`Skipping already processed: ${period.year}/${period.month} - ${categoryCode}`)
          continue
        }
      }
      
      progress.currentItem = `${period.displayName} - ${CATEGORIES[categoryCode].displayName}`
      onProgress?.(progress)
      
      try {
        const result = await scrapeArchive(prisma, period.year, period.month, categoryCode)
        
        progress.processedItems++
        
        // 404やデータなしも成功扱い
        if (result.success || result.totalRecords === 0) {
          progress.successfulItems++
          console.log(`✓ ${period.year}/${period.month} - ${categoryCode}: ${result.totalRecords || 0} records`)
        } else {
          progress.failedItems++
          progress.errors.push({
            item: `${period.year}/${period.month} - ${categoryCode}`,
            error: result.error || 'Unknown error'
          })
          console.log(`✗ ${period.year}/${period.month} - ${categoryCode}: ${result.error}`)
        }
      } catch (error) {
        progress.processedItems++
        progress.failedItems++
        progress.errors.push({
          item: `${period.year}/${period.month} - ${categoryCode}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        console.error(`Error processing ${period.year}/${period.month} - ${categoryCode}:`, error)
      }
      
      // レート制限: 1秒待機
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // バッチサイズごとに長めの休憩
      if (options?.batchSize && progress.processedItems % options.batchSize === 0) {
        console.log(`Batch break: processed ${progress.processedItems} items, waiting 5 seconds...`)
        await new Promise(resolve => setTimeout(resolve, 5000)) // 5秒待機
      }
    }
  }
  
  onProgress?.(progress)
  console.log(`Scraping completed: ${progress.successfulItems} successful, ${progress.failedItems} failed`)
}

/**
 * 処理済み期間のサマリーを取得
 */
export async function getProcessedPeriodsSummary(prisma: PrismaClient) {
  const logs = await prisma.scrapingLog.findMany({
    where: {
      success: true,
      dataSource: 'archive'
    },
    select: {
      categoryCode: true,
      rankingDate: true,
      totalRecords: true
    },
    orderBy: {
      rankingDate: 'asc'
    }
  })
  
  // 年月ごとにグループ化
  const summary = new Map<string, {
    categories: Set<string>
    totalRecords: number
  }>()
  
  logs.forEach(log => {
    const yearMonth = log.rankingDate.toISOString().slice(0, 7)
    if (!summary.has(yearMonth)) {
      summary.set(yearMonth, {
        categories: new Set(),
        totalRecords: 0
      })
    }
    const entry = summary.get(yearMonth)!
    entry.categories.add(log.categoryCode)
    entry.totalRecords += log.totalRecords
  })
  
  return {
    totalPeriods: summary.size,
    periods: Array.from(summary.entries()).map(([yearMonth, data]) => ({
      yearMonth,
      categoriesProcessed: data.categories.size,
      totalRecords: data.totalRecords
    })),
    earliestData: logs[0]?.rankingDate,
    latestData: logs[logs.length - 1]?.rankingDate
  }
}

/**
 * 未処理のアーカイブをスクレイピング
 */
export async function scrapeUnprocessedArchives(
  prisma: PrismaClient,
  onProgress?: ProgressCallback
): Promise<void> {
  // 未処理の期間を取得
  const allPeriods = generateArchivePeriods()
  const processedPeriods = await prisma.archivePeriod.findMany({
    where: { isProcessed: true },
    select: { year: true, month: true }
  })
  
  const processedSet = new Set(
    processedPeriods.map(p => `${p.year}-${p.month}`)
  )
  
  const unprocessedPeriods = allPeriods.filter(
    period => !processedSet.has(`${period.year}-${period.month}`)
  )
  
  if (unprocessedPeriods.length === 0) {
    console.log('All archives have been processed')
    return
  }
  
  await scrapeAllArchives(prisma, onProgress, {
    startYear: unprocessedPeriods[0].year,
    startMonth: unprocessedPeriods[0].month
  })
}

/**
 * スクレイピング統計情報を取得
 */
export async function getScrapingStats(prisma: PrismaClient) {
  const [
    totalPlayers,
    totalRankings,
    totalScrapingLogs,
    successfulScrapings,
    failedScrapings,
    processedPeriods,
    totalPeriods
  ] = await Promise.all([
    prisma.player.count(),
    prisma.ranking.count(),
    prisma.scrapingLog.count(),
    prisma.scrapingLog.count({ where: { success: true } }),
    prisma.scrapingLog.count({ where: { success: false } }),
    prisma.archivePeriod.count({ where: { isProcessed: true } }),
    prisma.archivePeriod.count()
  ])
  
  const latestScraping = await prisma.scrapingLog.findFirst({
    orderBy: { createdAt: 'desc' }
  })
  
  return {
    totalPlayers,
    totalRankings,
    totalScrapingLogs,
    successfulScrapings,
    failedScrapings,
    successRate: totalScrapingLogs > 0 
      ? (successfulScrapings / totalScrapingLogs * 100).toFixed(2) + '%'
      : '0%',
    processedPeriods,
    totalPeriods,
    completionRate: totalPeriods > 0
      ? (processedPeriods / totalPeriods * 100).toFixed(2) + '%'
      : '0%',
    lastScrapingDate: latestScraping?.createdAt
  }
}