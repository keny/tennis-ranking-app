// scripts/update-archive-periods.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateAllArchivePeriods() {
  try {
    console.log('Updating all archive periods with JTA rules...')
    
    // 全ランキングデータを取得
    const rankings = await prisma.ranking.findMany({
      select: {
        rankingDate: true,
        categoryCode: true
      }
    })
    
    // JTAルールに従って期間を決定
    const periodMap = new Map<string, Set<string>>()
    
    rankings.forEach(ranking => {
      const rankingDate = ranking.rankingDate
      let year = rankingDate.getFullYear()
      let month = rankingDate.getMonth() + 1
      
      // 月末日付（28日以降）の場合は翌月として扱う
      const day = rankingDate.getDate()
      if (day >= 28) {
        month += 1
        if (month > 12) {
          month = 1
          year += 1
        }
      }
      
      const key = `${year}-${month}`
      
      if (!periodMap.has(key)) {
        periodMap.set(key, new Set())
      }
      periodMap.get(key)!.add(ranking.categoryCode)
    })
    
    // 各期間のArchivePeriodを更新
    for (const [key, categories] of periodMap) {
      const [year, month] = key.split('-').map(Number)
      const processedCategories = categories.size
      
      // アーカイブ日は前月末日
      let archiveYear = year
      let archiveMonth = month - 1
      if (archiveMonth < 1) {
        archiveMonth = 12
        archiveYear -= 1
      }
      const archiveDate = new Date(archiveYear, archiveMonth, 0)
      
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
          archiveDate,
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
      
      console.log(`Updated ${year}/${month}: ${processedCategories}/44 categories (archive date: ${archiveDate.toISOString().slice(0, 10)})`)
    }
    
    console.log('All archive periods updated successfully')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 実行
updateAllArchivePeriods()