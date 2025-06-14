// app/api/admin/scraping/archive/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeArchive, scrapeArchivePeriod } from '@/lib/scraping/scraping-service'
import { CategoryCode, CATEGORIES } from '@/lib/scraping/archive-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Archive API received body:', body) // デバッグログ
    
    const { year, month, gender, type, ageGroup, categoryCode } = body

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      )
    }

    // categoryCodeが直接指定されているか、またはgender/type/ageGroupから構築
    let targetCategoryCode: string | null = null

    // 1. 直接categoryCodeが指定されている場合（最優先）
    if (categoryCode && categoryCode !== 'all') {
      targetCategoryCode = categoryCode
      console.log(`Using directly specified categoryCode: ${targetCategoryCode}`)
    } 
    // 2. gender, type, ageGroupから構築する場合
    else if (gender && type && ageGroup) {
      // JTAのカテゴリコード形式: g=男子(gentlemen), l=女子(ladies)
      const genderPrefix = gender === 'male' ? 'g' : gender === 'female' ? 'l' : null
      const typePrefix = type === 'singles' ? 's' : type === 'doubles' ? 'd' : null
      
      if (genderPrefix && typePrefix) {
        targetCategoryCode = `${genderPrefix}${typePrefix}${ageGroup}`
        console.log(`Built categoryCode from parts: ${targetCategoryCode}`)
      }
    }
    
    console.log(`Final target category code: ${targetCategoryCode}`) // デバッグ用
    
    // CATEGORIESオブジェクトの確認
    console.log(`CATEGORIES keys:`, Object.keys(CATEGORIES))
    console.log(`Is ${targetCategoryCode} in CATEGORIES?`, targetCategoryCode ? CATEGORIES[targetCategoryCode as CategoryCode] : 'null')
    console.log(`Type of targetCategoryCode:`, typeof targetCategoryCode)

    // 特定カテゴリか全カテゴリかの判定
    if (targetCategoryCode && CATEGORIES[targetCategoryCode as CategoryCode]) {
      // 特定カテゴリをスクレイピング
      console.log(`Scraping specific category: ${targetCategoryCode} for ${year}/${month}`)
      
      const result = await scrapeArchive(prisma, year, month, targetCategoryCode as CategoryCode)
      
      return NextResponse.json({
        success: result.success,
        totalRecords: result.totalRecords,
        executionTimeMs: result.executionTimeMs,
        error: result.error,
        category: targetCategoryCode,
        message: result.success 
          ? `Category ${targetCategoryCode} for ${year}/${month} scraped successfully (${result.totalRecords} records)`
          : `Failed to scrape ${targetCategoryCode} for ${year}/${month}: ${result.error}`
      })
    } else if (targetCategoryCode) {
      // カテゴリコードは指定されているが、CATEGORIESに存在しない
      console.error(`Invalid category code: ${targetCategoryCode}`)
      console.log(`Available categories:`, Object.keys(CATEGORIES))
      
      // それでも処理を試みる
      try {
        console.log(`Attempting to scrape with category code: ${targetCategoryCode}`)
        const result = await scrapeArchive(prisma, year, month, targetCategoryCode as CategoryCode)
        
        return NextResponse.json({
          success: result.success,
          totalRecords: result.totalRecords,
          executionTimeMs: result.executionTimeMs,
          error: result.error,
          category: targetCategoryCode,
          message: result.success 
            ? `Category ${targetCategoryCode} for ${year}/${month} scraped successfully (${result.totalRecords} records)`
            : `Failed to scrape ${targetCategoryCode} for ${year}/${month}: ${result.error}`
        })
      } catch (error) {
        console.error(`Failed to scrape ${targetCategoryCode}:`, error)
        return NextResponse.json({
          success: false,
          error: `Invalid category code: ${targetCategoryCode}`,
          availableCategories: Object.keys(CATEGORIES)
        }, { status: 400 })
      }
    } else {
      // 全カテゴリをスクレイピング
      console.log(`Scraping all categories for ${year}/${month}`)
      
      const results = await scrapeArchivePeriod(prisma, year, month, (progress) => {
        console.log(`Progress: ${progress.processedItems}/${progress.totalItems}`)
      })
      
      // 結果のサマリーを作成
      let successCount = 0
      let totalRecords = 0
      results.forEach((result) => {
        if (result.success) {
          successCount++
          totalRecords += result.totalRecords || 0
        }
      })
      
      return NextResponse.json({
        success: true,
        message: `All categories for ${year}/${month} scraped successfully`,
        details: {
          totalCategories: results.size,
          successfulCategories: successCount,
          totalRecords: totalRecords
        }
      })
    }
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}