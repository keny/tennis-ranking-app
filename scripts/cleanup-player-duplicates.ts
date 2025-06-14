// scripts/cleanup-player-duplicates.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupPlayerDuplicates(targetYear?: number, targetMonth?: number) {
  try {
    console.log('Cleaning up duplicate player rankings...')
    
    if (targetYear && targetMonth) {
      console.log(`Target period: ${targetYear}/${targetMonth}`)
    } else {
      console.log('Target period: All data')
    }
    
    // 期間の条件を設定
    let dateFilter = {}
    if (targetYear && targetMonth) {
      const startDate = new Date(targetYear, targetMonth - 1, 1)
      const endDate = new Date(targetYear, targetMonth, 0)
      dateFilter = {
        rankingDate: {
          gte: startDate,
          lte: endDate
        }
      }
    }
    
    // 全ランキングデータを取得（必要な期間のみ）
    const allRankings = await prisma.ranking.findMany({
      where: dateFilter,
      include: {
        player: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Total rankings found: ${allRankings.length}`)
    
    // 選手ID、カテゴリ、年月でグループ化
    const groupedRankings = new Map<string, typeof allRankings>()
    
    allRankings.forEach(ranking => {
      const year = ranking.rankingDate.getFullYear()
      const month = ranking.rankingDate.getMonth() + 1
      const key = `${ranking.playerId}-${ranking.categoryCode}-${year}-${month}`
      
      if (!groupedRankings.has(key)) {
        groupedRankings.set(key, [])
      }
      groupedRankings.get(key)!.push(ranking)
    })
    
    // 重複を見つけて削除
    let totalDeleted = 0
    const deletePromises: Promise<any>[] = []
    
    for (const [key, rankings] of groupedRankings) {
      if (rankings.length > 1) {
        // 最新の1件を残して、古いものを削除
        const [keep, ...toDelete] = rankings // 最初が最新（createdAt descでソート済み）
        
        console.log(`Found duplicates for ${keep.player.name} (${keep.player.registrationNo}), Category: ${keep.categoryCode}, Date: ${keep.rankingDate.toISOString().slice(0, 7)}`)
        console.log(`  Keeping: rank ${keep.rankPosition}, created at ${keep.createdAt}`)
        
        for (const del of toDelete) {
          console.log(`  Deleting: rank ${del.rankPosition}, created at ${del.createdAt}`)
          deletePromises.push(
            prisma.ranking.delete({
              where: { id: del.id }
            })
          )
          totalDeleted++
        }
      }
    }
    
    // 削除を実行
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises)
      console.log(`\nTotal deleted: ${totalDeleted} duplicate rankings`)
    } else {
      console.log('\nNo duplicates found')
    }
    
    // アーカイブ期間の統計を更新
    await updateArchivePeriodStats(targetYear, targetMonth)
    
  } catch (error) {
    console.error('Cleanup error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function updateArchivePeriodStats(targetYear?: number, targetMonth?: number) {
  console.log('\nUpdating archive period statistics...')
  
  if (targetYear && targetMonth) {
    // 特定の月のみ更新
    await updateSinglePeriod(targetYear, targetMonth)
  } else {
    // 全期間を更新
    const periods = await prisma.archivePeriod.findMany()
    for (const period of periods) {
      await updateSinglePeriod(period.year, period.month)
    }
  }
}

async function updateSinglePeriod(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  
  // この期間のユニークなカテゴリ数を数える
  const uniqueCategories = await prisma.ranking.findMany({
    where: {
      rankingDate: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      categoryCode: true
    },
    distinct: ['categoryCode']
  })
  
  const processedCategories = uniqueCategories.length
  
  // アーカイブ期間を更新または作成
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
      archiveDate: endDate,
      displayName: `${year}年${month}月`,
      totalCategories: 44,
      processedCategories,
      isProcessed: processedCategories >= 44
    },
    update: {
      processedCategories,
      isProcessed: processedCategories >= 44
    }
  })
  
  console.log(`Updated ${year}/${month}: ${processedCategories}/44 categories`)
}

// コマンドライン引数から取得
const args = process.argv.slice(2)
if (args.length >= 2) {
  const year = parseInt(args[0])
  const month = parseInt(args[1])
  cleanupPlayerDuplicates(year, month)
} else if (args[0] === 'all') {
  cleanupPlayerDuplicates()
} else {
  console.log('Usage:')
  console.log('  npx tsx scripts/cleanup-player-duplicates.ts 2024 12  # Specific month')
  console.log('  npx tsx scripts/cleanup-player-duplicates.ts all      # All data')
}