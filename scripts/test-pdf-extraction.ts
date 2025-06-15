// scripts/test-pdf-extraction.ts
import { TournamentExtractor } from '../src/lib/tournament/tournament-extractor';
import { readFileSync } from 'fs';
import { join } from 'path';

async function testPDFExtraction(pdfPath: string) {
  try {
    console.log(`PDFファイルを読み込み中: ${pdfPath}`);
    const pdfBuffer = readFileSync(pdfPath);
    
    const extractor = new TournamentExtractor();
    console.log('PDFを解析中...');
    
    const result = await extractor.extractFromPDF(pdfBuffer);
    
    console.log('\n=== 抽出結果 ===');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n=== 統計 ===');
    result.categories.forEach(category => {
      console.log(`カテゴリー: ${category.category_info.name}`);
      console.log(`  ドローサイズ: ${category.category_info.draw_size}`);
      console.log(`  抽出された試合数: ${category.matches.length}`);
      console.log(`  期待される試合数: ${category.category_info.draw_size - 1}`);
      console.log(`  最終結果数: ${category.final_results.length}`);
      
      // ラウンド別の試合数
      const roundCounts: { [key: string]: number } = {};
      category.matches.forEach(match => {
        roundCounts[match.round] = (roundCounts[match.round] || 0) + 1;
      });
      console.log('  ラウンド別試合数:');
      Object.entries(roundCounts).forEach(([round, count]) => {
        console.log(`    ${round}: ${count}試合`);
      });
    });
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

// コマンドライン引数からPDFパスを取得
const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error('使用方法: npx tsx scripts/test-pdf-extraction.ts <PDFファイルパス>');
  process.exit(1);
}

testPDFExtraction(pdfPath);