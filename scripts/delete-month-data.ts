// scripts/delete-month-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteMonthData(year: number, month: number) {
  try {
    console.log(`Deleting data for ${year}/${month}...`)
    
    // 対象月の範囲を設定
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    
    // まず、どのくらいのデータがあるか確認
    const rankingCount = await prisma.ranking.count({
      where: {
        rankingDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    
    const scrapingLogCount = await prisma.scrapingLog.count({
      where: {
        rankingDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    
    console.log(`Found ${rankingCount} rankings and ${scrapingLogCount} scraping logs`)
    
    if (rankingCount === 0 && scrapingLogCount === 0) {
      console.log('No data found for this period')
      return
    }
    
    // 確認プロンプト
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const answer = await new Promise<string>((resolve) => {
      readline.question(`Are you sure you want to delete ${rankingCount} rankings and ${scrapingLogCount} logs? (yes/no): `, resolve)
    })
    
    readline.close()
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('Deletion cancelled')
      return
    }
    
    // トランザクションで削除
    await prisma.$transaction(async (tx) => {
      // ランキングデータを削除
      const deletedRankings = await tx.ranking.deleteMany({
        where: {
          rankingDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })
      
      // スクレイピングログを削除
      const deletedLogs = await tx.scrapingLog.deleteMany({
        where: {
          rankingDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })
      
      // アーカイブ期間の記録も削除または更新
      await tx.archivePeriod.deleteMany({
        where: {
          year,
          month
        }
      })
      
      console.log(`Deleted ${deletedRankings.count} rankings`)
      console.log(`Deleted ${deletedLogs.count} scraping logs`)
    })
    
    console.log('Deletion completed successfully')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// コマンドライン引数から取得
const args = process.argv.slice(2)
if (args.length >= 2) {
  const year = parseInt(args[0])
  const month = parseInt(args[1])
  
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    console.error('Invalid year or month')
    console.log('Usage: npx tsx scripts/delete-month-data.ts YYYY MM')
    process.exit(1)
  }
  
  deleteMonthData(year, month)
} else {
  console.log('Usage: npx tsx scripts/delete-month-data.ts YYYY MM')
  console.log('Example: npx tsx scripts/delete-month-data.ts 2025 6')
}

