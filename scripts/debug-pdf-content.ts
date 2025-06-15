// scripts/debug-pdf-content.ts

import * as fs from 'fs';
import pdf from 'pdf-parse';

async function debugPDF(pdfPath: string) {
  console.log(`📄 PDFを解析中: ${pdfPath}\n`);
  
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    
    console.log(`📊 PDF情報:`);
    console.log(`- ページ数: ${data.numpages}`);
    console.log(`- PDFバージョン: ${data.version}`);
    console.log(`- テキスト長: ${data.text.length}文字\n`);
    
    // 生のテキストを表示
    console.log(`📝 抽出されたテキスト（最初の2000文字）:\n`);
    console.log('='.repeat(80));
    console.log(data.text.substring(0, 2000));
    console.log('='.repeat(80));
    
    // 行に分割して表示
    const lines = data.text.split('\n');
    console.log(`\n📋 行ごとの内容（最初の50行）:\n`);
    
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 0) {
        // 特別な行を強調表示
        if (line.match(/[GL]\d{7}/)) {
          console.log(`${String(i).padStart(3)}: 🎾 [選手] ${line}`);
        } else if (line.toLowerCase() === 'bye') {
          console.log(`${String(i).padStart(3)}: ⏭️  [BYE] ${line}`);
        } else if (line.match(/^\d+\s+/)) {
          console.log(`${String(i).padStart(3)}: 📍 [番号] ${line}`);
        } else if (line.match(/\d{2}\s+\d{2}/)) {
          console.log(`${String(i).padStart(3)}: 📊 [スコア] ${line}`);
        } else if (line.includes('W.O')) {
          console.log(`${String(i).padStart(3)}: 🚫 [W.O.] ${line}`);
        } else {
          console.log(`${String(i).padStart(3)}:     ${line}`);
        }
      }
    }
    
    // テキストファイルとして保存
    const outputPath = pdfPath.replace('.pdf', '_raw_text.txt');
    fs.writeFileSync(outputPath, data.text, 'utf8');
    console.log(`\n💾 生のテキストを保存: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// メイン処理
const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error('使用方法: npx tsx scripts/debug-pdf-content.ts <PDFファイルパス>');
  process.exit(1);
}

debugPDF(pdfPath);