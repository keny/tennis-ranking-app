// src/lib/scraping/archive-utils.ts

import { format, startOfMonth, endOfMonth } from 'date-fns'

// カテゴリ定義
export const CATEGORIES = {
  // 男子シングルス
  gs35: { gender: 'male', type: 'singles', ageGroup: 35, displayName: '男子35歳以上シングルス' },
  gs40: { gender: 'male', type: 'singles', ageGroup: 40, displayName: '男子40歳以上シングルス' },
  gs45: { gender: 'male', type: 'singles', ageGroup: 45, displayName: '男子45歳以上シングルス' },
  gs50: { gender: 'male', type: 'singles', ageGroup: 50, displayName: '男子50歳以上シングルス' },
  gs55: { gender: 'male', type: 'singles', ageGroup: 55, displayName: '男子55歳以上シングルス' },
  gs60: { gender: 'male', type: 'singles', ageGroup: 60, displayName: '男子60歳以上シングルス' },
  gs65: { gender: 'male', type: 'singles', ageGroup: 65, displayName: '男子65歳以上シングルス' },
  gs70: { gender: 'male', type: 'singles', ageGroup: 70, displayName: '男子70歳以上シングルス' },
  gs75: { gender: 'male', type: 'singles', ageGroup: 75, displayName: '男子75歳以上シングルス' },
  gs80: { gender: 'male', type: 'singles', ageGroup: 80, displayName: '男子80歳以上シングルス' },
  gs85: { gender: 'male', type: 'singles', ageGroup: 85, displayName: '男子85歳以上シングルス' },
  
  // 男子ダブルス
  gd35: { gender: 'male', type: 'doubles', ageGroup: 35, displayName: '男子35歳以上ダブルス' },
  gd40: { gender: 'male', type: 'doubles', ageGroup: 40, displayName: '男子40歳以上ダブルス' },
  gd45: { gender: 'male', type: 'doubles', ageGroup: 45, displayName: '男子45歳以上ダブルス' },
  gd50: { gender: 'male', type: 'doubles', ageGroup: 50, displayName: '男子50歳以上ダブルス' },
  gd55: { gender: 'male', type: 'doubles', ageGroup: 55, displayName: '男子55歳以上ダブルス' },
  gd60: { gender: 'male', type: 'doubles', ageGroup: 60, displayName: '男子60歳以上ダブルス' },
  gd65: { gender: 'male', type: 'doubles', ageGroup: 65, displayName: '男子65歳以上ダブルス' },
  gd70: { gender: 'male', type: 'doubles', ageGroup: 70, displayName: '男子70歳以上ダブルス' },
  gd75: { gender: 'male', type: 'doubles', ageGroup: 75, displayName: '男子75歳以上ダブルス' },
  gd80: { gender: 'male', type: 'doubles', ageGroup: 80, displayName: '男子80歳以上ダブルス' },
  gd85: { gender: 'male', type: 'doubles', ageGroup: 85, displayName: '男子85歳以上ダブルス' },
  
  // 女子シングルス
  ls35: { gender: 'female', type: 'singles', ageGroup: 35, displayName: '女子35歳以上シングルス' },
  ls40: { gender: 'female', type: 'singles', ageGroup: 40, displayName: '女子40歳以上シングルス' },
  ls45: { gender: 'female', type: 'singles', ageGroup: 45, displayName: '女子45歳以上シングルス' },
  ls50: { gender: 'female', type: 'singles', ageGroup: 50, displayName: '女子50歳以上シングルス' },
  ls55: { gender: 'female', type: 'singles', ageGroup: 55, displayName: '女子55歳以上シングルス' },
  ls60: { gender: 'female', type: 'singles', ageGroup: 60, displayName: '女子60歳以上シングルス' },
  ls65: { gender: 'female', type: 'singles', ageGroup: 65, displayName: '女子65歳以上シングルス' },
  ls70: { gender: 'female', type: 'singles', ageGroup: 70, displayName: '女子70歳以上シングルス' },
  ls75: { gender: 'female', type: 'singles', ageGroup: 75, displayName: '女子75歳以上シングルス' },
  ls80: { gender: 'female', type: 'singles', ageGroup: 80, displayName: '女子80歳以上シングルス' },
  ls85: { gender: 'female', type: 'singles', ageGroup: 85, displayName: '女子85歳以上シングルス' },
  
  // 女子ダブルス
  ld35: { gender: 'female', type: 'doubles', ageGroup: 35, displayName: '女子35歳以上ダブルス' },
  ld40: { gender: 'female', type: 'doubles', ageGroup: 40, displayName: '女子40歳以上ダブルス' },
  ld45: { gender: 'female', type: 'doubles', ageGroup: 45, displayName: '女子45歳以上ダブルス' },
  ld50: { gender: 'female', type: 'doubles', ageGroup: 50, displayName: '女子50歳以上ダブルス' },
  ld55: { gender: 'female', type: 'doubles', ageGroup: 55, displayName: '女子55歳以上ダブルス' },
  ld60: { gender: 'female', type: 'doubles', ageGroup: 60, displayName: '女子60歳以上ダブルス' },
  ld65: { gender: 'female', type: 'doubles', ageGroup: 65, displayName: '女子65歳以上ダブルス' },
  ld70: { gender: 'female', type: 'doubles', ageGroup: 70, displayName: '女子70歳以上ダブルス' },
  ld75: { gender: 'female', type: 'doubles', ageGroup: 75, displayName: '女子75歳以上ダブルス' },
  ld80: { gender: 'female', type: 'doubles', ageGroup: 80, displayName: '女子80歳以上ダブルス' },
  ld85: { gender: 'female', type: 'doubles', ageGroup: 85, displayName: '女子85歳以上ダブルス' },
} as const

export type CategoryCode = keyof typeof CATEGORIES

// アーカイブ期間の生成
export interface ArchivePeriod {
  year: number
  month: number
  urlPath: string  // "202008vet"
  displayName: string
  startDate: Date
  endDate: Date
}

/**
 * 2004年1月から現在までのアーカイブ期間を生成
 */
export function generateArchivePeriods(startYear: number = 2004, startMonth: number = 1): ArchivePeriod[] {
  const periods: ArchivePeriod[] = []
  const startDate = new Date(startYear, startMonth - 1, 1)
  const currentDate = new Date()
  
  let date = startDate
  while (date <= currentDate) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    
    periods.push({
      year,
      month,
      urlPath: `${year}${month.toString().padStart(2, '0')}vet`,
      displayName: `${year}年${month}月`,
      startDate: startOfMonth(date),
      endDate: endOfMonth(date)
    })
    
    // 次の月へ
    date = new Date(year, month, 1)
  }
  
  return periods
}

/**
 * 利用可能な期間を自動検出（404チェック機能付き）
 */
export async function detectAvailablePeriods(
  startYear: number = 2004,
  endYear?: number
): Promise<ArchivePeriod[]> {
  const allPeriods = generateArchivePeriods(startYear, 1)
  const availablePeriods: ArchivePeriod[] = []
  
  // サンプルカテゴリ（gs45）で各期間の存在をチェック
  for (const period of allPeriods) {
    if (endYear && period.year > endYear) break
    
    const url = generateArchiveUrl(period, 'gs45')
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (response.ok) {
        availablePeriods.push(period)
      }
    } catch {
      // URLが存在しない場合はスキップ
    }
  }
  
  return availablePeriods
}

/**
 * アーカイブURLを生成
 */
export function generateArchiveUrl(period: ArchivePeriod, categoryCode: CategoryCode): string {
  return `http://archives.jta-tennis.or.jp/rankings/${period.urlPath}/page.php?cid=${categoryCode}`
}

/**
 * 最新ランキングURLを生成
 */
export function generateLatestUrl(categoryCode: CategoryCode): string {
  return `http://archives.jta-tennis.or.jp/rankings/vet/page.php?cid=${categoryCode}`
}

/**
 * 全アーカイブURLを生成（全期間×全カテゴリ）
 */
export function generateAllArchiveUrls(): Array<{
  period: ArchivePeriod
  categoryCode: CategoryCode
  category: typeof CATEGORIES[CategoryCode]
  url: string
}> {
  const periods = generateArchivePeriods()
  const urls: Array<{
    period: ArchivePeriod
    categoryCode: CategoryCode
    category: typeof CATEGORIES[CategoryCode]
    url: string
  }> = []
  
  for (const period of periods) {
    for (const [categoryCode, category] of Object.entries(CATEGORIES)) {
      urls.push({
        period,
        categoryCode: categoryCode as CategoryCode,
        category,
        url: generateArchiveUrl(period, categoryCode as CategoryCode)
      })
    }
  }
  
  return urls
}

/**
 * 未処理のアーカイブ期間を取得するためのヘルパー
 */
export async function getUnprocessedPeriods(
  prisma: any,
  categoryCode?: CategoryCode
): Promise<ArchivePeriod[]> {
  // 処理済みの期間を取得
  const processed = await prisma.archivePeriod.findMany({
    where: categoryCode ? {
      scrapingLogs: {
        some: {
          categoryCode,
          success: true
        }
      }
    } : {
      isProcessed: true
    },
    select: {
      year: true,
      month: true
    }
  })
  
  const processedSet = new Set(
    processed.map(p => `${p.year}-${p.month}`)
  )
  
  // 全期間から処理済みを除外
  const allPeriods = generateArchivePeriods()
  return allPeriods.filter(
    period => !processedSet.has(`${period.year}-${period.month}`)
  )
}

/**
 * バッチ処理用：期間とカテゴリをチャンクに分割
 */
export function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }
  return batches
}