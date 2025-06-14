// src/lib/scraping/debug-scraper.ts

import * as cheerio from 'cheerio'

/**
 * HTMLの構造をデバッグするための関数
 */
export async function debugScraping(url: string): Promise<void> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    console.log('=== HTML Debug Info ===')
    
    // テーブルの数を確認
    const tables = $('table').toArray()
    console.log(`Total tables found: ${tables.length}`)
    
    // 各テーブルの情報
    tables.forEach((table, index) => {
      const rows = $(table).find('tr').length
      const firstRow = $(table).find('tr').first()
      const cells = firstRow.find('td, th').length
      
      console.log(`\nTable ${index + 1}:`)
      console.log(`  Rows: ${rows}`)
      console.log(`  Columns in first row: ${cells}`)
      
      // 最初の3行を表示
      if (rows > 0) {
        console.log('  First 3 rows:')
        $(table).find('tr').slice(0, 3).each((i, row) => {
          const cellTexts = $(row).find('td, th').map((j, cell) => 
            $(cell).text().trim().slice(0, 20)
          ).get()
          console.log(`    Row ${i}: [${cellTexts.join(' | ')}]`)
        })
      }
    })
    
    // 最も大きなテーブルを詳細に解析
    const largestTable = tables.reduce((prev, current) => {
      const prevRows = $(prev).find('tr').length
      const currentRows = $(current).find('tr').length
      return currentRows > prevRows ? current : prev
    })
    
    console.log('\n=== Largest Table Analysis ===')
    const rows = $(largestTable).find('tr').toArray()
    
    // 最初の10行を詳細に表示
    rows.slice(0, 10).forEach((row, i) => {
      const cells = $(row).find('td').toArray()
      console.log(`\nRow ${i}:`)
      cells.forEach((cell, j) => {
        const text = $(cell).text().trim()
        console.log(`  Cell ${j}: "${text}"`)
      })
    })
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

// 使用例（APIルートから呼び出し）
export async function testDebug() {
  const url = 'http://archives.jta-tennis.or.jp/rankings/vet/page.php?cid=gs45'
  await debugScraping(url)
}