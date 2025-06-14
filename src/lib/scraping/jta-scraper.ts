// src/lib/scraping/jta-scraper.ts

import * as cheerio from 'cheerio'
import { PrismaClient } from '@prisma/client'
import { CategoryCode, CATEGORIES } from './archive-utils'

// スクレイピング結果の型定義
export interface PlayerRankingData {
  rank: number
  isTied: boolean  // タイ（同着）フラグ
  registrationNo: string
  name: string
  club: string
  prefecture: string
  calcPoints: number
  totalPoints: number
}

export interface ScrapingResult {
  success: boolean
  data?: PlayerRankingData[]
  error?: string
  totalRecords?: number
  executionTimeMs?: number
}

// HTTPクライアントの設定
const fetchWithTimeout = async (url: string, timeoutMs: number = 30000): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

/**
 * JTAランキングページをスクレイピング（404対応版）
 */
export async function scrapeRankingPage(url: string): Promise<ScrapingResult & { rankingDate?: Date, updateDate?: Date }> {
  const startTime = Date.now()
  
  try {
    // HTMLを取得
    const response = await fetchWithTimeout(url)
    
    // 404エラーの場合は成功扱いでスキップ
    if (response.status === 404) {
      return {
        success: true,
        data: [],
        totalRecords: 0,
        executionTimeMs: Date.now() - startTime,
        error: 'Page not found (404) - Data may not exist for this period/category'
      }
    }
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error: ${response.status}`
      }
    }
    
    const html = await response.text()
    
    // HTMLをパース
    const $ = cheerio.load(html)
    const players: PlayerRankingData[] = []
    
    // ランキング日付と更新日を探す
    let rankingDate: Date | undefined
    let updateDate: Date | undefined
    
    // "YYYY年MM月DD日付" のパターンを探す
    const datePattern = /(\d{4})年(\d{1,2})月(\d{1,2})日付/
    const updatePattern = /更新日[:：]\s*(\d{4})\/(\d{1,2})\/(\d{1,2})/
    
    // ページ全体のテキストから日付を探す
    const pageText = $('body').text()
    
    const rankingDateMatch = pageText.match(datePattern)
    if (rankingDateMatch) {
      const [_, year, month, day] = rankingDateMatch
      rankingDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      console.log(`Found ranking date: ${rankingDate.toISOString().slice(0, 10)}`)
    }
    
    const updateDateMatch = pageText.match(updatePattern)
    if (updateDateMatch) {
      const [_, year, month, day] = updateDateMatch
      updateDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      console.log(`Found update date: ${updateDate.toISOString().slice(0, 10)}`)
    }
    
    // ランキングテーブルを探す
    const rows = $('table tr').toArray()
    
    // テーブルが見つからない、または1行しかない（ヘッダーのみ）場合
    if (rows.length <= 1) {
      return {
        success: true,
        data: [],
        totalRecords: 0,
        executionTimeMs: Date.now() - startTime,
        error: 'No ranking data found on page',
        rankingDate,
        updateDate
      }
    }
    
    // ヘッダー行（Row 0）をスキップして、データ行を処理
    for (let i = 1; i < rows.length; i++) {
      const cells = $(rows[i]).find('td').toArray()
      
      // セルが9個あることを確認
      if (cells.length === 9) {
        const rankText = $(cells[0]).text().trim()
        const rank = parseInt(rankText)
        
        // 順位が数値でない場合はスキップ
        if (isNaN(rank)) continue
        
        // Cell 1 は "タイ"列（"T"または空欄）
        const tieText = $(cells[1]).text().trim()
        const isTied = tieText === 'T' || tieText === 'タイ'
        
        // Cell 2 は "登録"列（年度またはP）
        const registrationNo = $(cells[3]).text().trim()
        const name = $(cells[4]).text().trim()
        const club = $(cells[5]).text().trim()
        const prefecture = $(cells[6]).text().trim()
        const calcPointsText = $(cells[7]).text().trim().replace(/,/g, '')
        const totalPointsText = $(cells[8]).text().trim().replace(/,/g, '')
        
        // データ検証
        if (rank && registrationNo && name) {
          players.push({
            rank,
            isTied,
            registrationNo,
            name,
            club: club || '',
            prefecture: prefecture || '',
            calcPoints: parseInt(calcPointsText) || 0,
            totalPoints: parseInt(totalPointsText) || 0
          })
        }
      }
    }
    
    const executionTimeMs = Date.now() - startTime
    
    return {
      success: true,
      data: players,
      totalRecords: players.length,
      executionTimeMs,
      rankingDate,
      updateDate
    }
    
  } catch (error) {
    const executionTimeMs = Date.now() - startTime
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs
    }
  }
}

/**
 * スクレイピング結果をデータベースに保存（404やデータなしも正常処理）
 */
export async function saveRankingData(
  prisma: PrismaClient,
  categoryCode: CategoryCode,
  rankingDate: Date,
  scrapingResult: ScrapingResult,
  dataSource: 'latest' | 'archive' = 'archive',
  archivePeriodId?: number
): Promise<void> {
  const category = CATEGORIES[categoryCode]
  
  // スクレイピングログを作成（404やデータなしも成功として記録）
  const scrapingLog = await prisma.scrapingLog.create({
    data: {
      categoryCode,
      gender: category.gender,
      type: category.type,
      ageGroup: category.ageGroup,
      rankingDate,
      archivePeriodId,
      totalRecords: scrapingResult.totalRecords || 0,
      success: scrapingResult.success,
      errorMessage: scrapingResult.error,
      executionTimeMs: scrapingResult.executionTimeMs,
      dataSource
    }
  })
  
  // エラーの場合でも、404やデータなしは正常終了
  if (!scrapingResult.success || !scrapingResult.data || scrapingResult.data.length === 0) {
    return
  }
  
  // 最新フラグの更新（dataSourceがlatestの場合のみ）
  if (dataSource === 'latest') {
    // 同じカテゴリの全ランキングを非最新に更新
    await prisma.ranking.updateMany({
      where: {
        categoryCode,
        isLatest: true
      },
      data: {
        isLatest: false
      }
    })
  }
  
  // 選手データとランキングを保存
  for (const playerData of scrapingResult.data) {
    // 選手をupsert（存在しなければ作成、存在すれば更新）
    const player = await prisma.player.upsert({
      where: {
        registrationNo: playerData.registrationNo
      },
      create: {
        registrationNo: playerData.registrationNo,
        name: playerData.name,
        club: playerData.club,
        prefecture: playerData.prefecture
      },
      update: {
        name: playerData.name,
        club: playerData.club,
        prefecture: playerData.prefecture
      }
    })
    
    // ランキングをupsert
    await prisma.ranking.upsert({
      where: {
        playerId_categoryCode_rankingDate: {
          playerId: player.id,
          categoryCode,
          rankingDate
        }
      },
      create: {
        playerId: player.id,
        categoryCode,
        gender: category.gender,
        type: category.type,
        ageGroup: category.ageGroup,
        rankPosition: playerData.rank,
        totalPoints: playerData.totalPoints,
        calcPoints: playerData.calcPoints,
        rankingDate,
        isLatest: dataSource === 'latest',
        isTied: playerData.isTied,
        scrapingLogId: scrapingLog.id
      },
      update: {
        rankPosition: playerData.rank,
        totalPoints: playerData.totalPoints,
        calcPoints: playerData.calcPoints,
        isLatest: dataSource === 'latest',
        isTied: playerData.isTied,
        scrapingLogId: scrapingLog.id
      }
    })
    
    // 選手カテゴリ履歴を更新
    await updatePlayerCategoryHistory(prisma, player.id, categoryCode, category, playerData, rankingDate)
  }
  
  // ArchivePeriodを更新（最新ランキングも含む）
  if (scrapingResult.data && scrapingResult.data.length > 0) {
    const year = rankingDate.getFullYear()
    const month = rankingDate.getMonth() + 1
    
    // 現在の処理状況を確認
    const existingCategories = await prisma.ranking.findMany({
      where: {
        rankingDate: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0)
        }
      },
      select: {
        categoryCode: true
      },
      distinct: ['categoryCode']
    })
    
    await prisma.archivePeriod.upsert({
      where: {
        year_month: {
          year,
          month
        }
      },
      create: {
        year,
        month,
        archiveDate: rankingDate,
        displayName: `${year}年${month}月`,
        totalCategories: 44,
        processedCategories: existingCategories.length,
        isProcessed: existingCategories.length >= 44
      },
      update: {
        processedCategories: existingCategories.length,
        isProcessed: existingCategories.length >= 44
      }
    })
  }
}

/**
 * 選手カテゴリ履歴を更新
 */
async function updatePlayerCategoryHistory(
  prisma: PrismaClient,
  playerId: number,
  categoryCode: CategoryCode,
  category: typeof CATEGORIES[CategoryCode],
  playerData: PlayerRankingData,
  rankingDate: Date
): Promise<void> {
  const existing = await prisma.playerCategoryHistory.findUnique({
    where: {
      playerId_categoryCode: {
        playerId,
        categoryCode
      }
    }
  })
  
  if (existing) {
    // 既存の履歴を更新
    await prisma.playerCategoryHistory.update({
      where: {
        id: existing.id
      },
      data: {
        lastAppearance: rankingDate,
        totalAppearances: existing.totalAppearances + 1,
        bestRank: existing.bestRank 
          ? Math.min(existing.bestRank, playerData.rank) 
          : playerData.rank,
        bestPoints: existing.bestPoints 
          ? Math.max(existing.bestPoints, playerData.totalPoints) 
          : playerData.totalPoints
      }
    })
  } else {
    // 新規作成
    await prisma.playerCategoryHistory.create({
      data: {
        playerId,
        categoryCode,
        gender: category.gender,
        type: category.type,
        ageGroup: category.ageGroup,
        firstAppearance: rankingDate,
        lastAppearance: rankingDate,
        totalAppearances: 1,
        bestRank: playerData.rank,
        bestPoints: playerData.totalPoints
      }
    })
  }
}

/**
 * カテゴリ別にスクレイピングを実行
 */
export async function scrapeCategoryForPeriod(
  prisma: PrismaClient,
  categoryCode: CategoryCode,
  year: number,
  month: number,
  archiveUrl: string
): Promise<ScrapingResult> {
  // ランキング基準日（月末）を設定
  const rankingDate = new Date(year, month - 1 + 1, 0) // 月末日
  
  // アーカイブ期間を取得または作成
  const archivePeriod = await prisma.archivePeriod.upsert({
    where: {
      year_month: {
        year,
        month
      }
    },
    create: {
      year,
      month,
      archiveDate: rankingDate,
      displayName: `${year}年${month}月`,
      totalCategories: Object.keys(CATEGORIES).length
    },
    update: {}
  })
  
  // スクレイピング実行
  const result = await scrapeRankingPage(archiveUrl)
  
  // 結果を保存
  await saveRankingData(
    prisma,
    categoryCode,
    rankingDate,
    result,
    'archive',
    archivePeriod.id
  )
  
  // 進捗を更新
  if (result.success) {
    await prisma.archivePeriod.update({
      where: { id: archivePeriod.id },
      data: {
        processedCategories: {
          increment: 1
        },
        isProcessed: archivePeriod.processedCategories + 1 >= archivePeriod.totalCategories
      }
    })
  }
  
  return result
}

/**
 * レート制限付きでスクレイピングを実行
 */
export async function scrapeWithRateLimit(
  urls: Array<{ url: string; metadata: any }>,
  delayMs: number = 1000
): Promise<Array<{ metadata: any; result: ScrapingResult }>> {
  const results: Array<{ metadata: any; result: ScrapingResult }> = []
  
  for (const { url, metadata } of urls) {
    const result = await scrapeRankingPage(url)
    results.push({ metadata, result })
    
    // 次のリクエストまで待機
    if (urls.indexOf({ url, metadata }) < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return results
}