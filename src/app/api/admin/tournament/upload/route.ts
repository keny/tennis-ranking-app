import { NextRequest, NextResponse } from 'next/server';
import { TournamentExtractor } from '@/lib/tournament/tournament-extractor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extractor = new TournamentExtractor();

    console.log('Extracting data from PDF...');
    // PDFから抽出
    const data = await extractor.extractFromPDF(buffer);
    
    console.log('Saving to database...');
    // データベースに保存
    await extractor.saveToDatabase(data);

    return NextResponse.json({
      success: true,
      tournament: data.tournament,
      categoriesProcessed: data.categories.length,
      message: `${data.tournament.name} (${data.categories.length}カテゴリー) を登録しました`,
    });
  } catch (error) {
    console.error('Tournament extraction error:', error);
    
    // エラーメッセージを詳細に
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to process tournament PDF',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// ファイルサイズ制限を設定
export const runtime = 'nodejs';
export const maxDuration = 60; // 60秒のタイムアウト