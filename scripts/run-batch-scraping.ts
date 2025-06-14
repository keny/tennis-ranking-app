// scripts/run-batch-scraping.ts
import { prisma } from '@/lib/prisma';
import { scrapeAllArchives } from '@/lib/scraping/scraping-service';

async function runBatchScraping() {
  console.log('バッチスクレイピングを開始します...');
  console.log('開始時刻:', new Date().toLocaleString('ja-JP'));
  
  const args = process.argv.slice(2);
  const startYear = args[0] ? parseInt(args[0]) : 2024;
  const startMonth = args[1] ? parseInt(args[1]) : 1;
  const endYear = args[2] ? parseInt(args[2]) : new Date().getFullYear();
  const endMonth = args[3] ? parseInt(args[3]) : 12;
  
  console.log(`期間: ${startYear}年${startMonth}月 〜 ${endYear}年${endMonth}月`);
  
  try {
    await scrapeAllArchives(
      prisma,
      (progress) => {
        const percentage = progress.totalItems > 0 
          ? Math.round((progress.processedItems / progress.totalItems) * 100) 
          : 0;
        
        console.log(`
進捗: ${progress.processedItems}/${progress.totalItems} (${percentage}%)
成功: ${progress.successfulItems}
失敗: ${progress.failedItems}
現在処理中: ${progress.currentItem || 'なし'}
        `.trim());
        
        // 10件ごとに詳細ログ
        if (progress.processedItems % 10 === 0 && progress.processedItems > 0) {
          console.log('------------------------');
          console.log(`経過時間: ${getElapsedTime()}`);
          console.log(`推定残り時間: ${estimateRemainingTime(progress)}`);
          console.log('------------------------');
        }
      },
      {
        startYear,
        startMonth,
        endYear,
        endMonth,
        batchSize: 100,
        skipExisting: true,
      }
    );
    
    console.log('\n✅ バッチスクレイピングが完了しました！');
    console.log('終了時刻:', new Date().toLocaleString('ja-JP'));
    
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

let startTime = Date.now();

function getElapsedTime(): string {
  const elapsed = Date.now() - startTime;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  return `${hours}時間${minutes}分${seconds}秒`;
}

function estimateRemainingTime(progress: any): string {
  if (progress.processedItems === 0) return '計算中...';
  
  const elapsed = Date.now() - startTime;
  const timePerItem = elapsed / progress.processedItems;
  const remainingItems = progress.totalItems - progress.processedItems;
  const remainingTime = timePerItem * remainingItems;
  
  const hours = Math.floor(remainingTime / 3600000);
  const minutes = Math.floor((remainingTime % 3600000) / 60000);
  
  return `約${hours}時間${minutes}分`;
}

// 実行
runBatchScraping().catch(console.error);