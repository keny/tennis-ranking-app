import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// グローバルでPrismaClientのインスタンスを管理
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 型定義（既存DBの型に合わせる）
const TournamentDataSchema = z.object({
  tournament: z.object({
    name: z.string(),
    year: z.number(),
    round: z.number().optional(),
    venue: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }),
  categories: z.array(z.object({
    category_info: z.object({
      name: z.string(),
      code: z.string(),
      gender: z.enum(['male', 'female']),
      type: z.enum(['singles', 'doubles']),
      age_group: z.number(),
      draw_size: z.number(),
    }),
    matches: z.array(z.object({
      round: z.string(),
      match_number: z.number().optional(),
      player1: z.object({
        name: z.string(),
        club: z.string().optional(),
        registration_no: z.string().optional(),
        seed: z.union([z.number(), z.string()]).optional().transform(val => 
          val ? (typeof val === 'string' ? parseInt(val, 10) : val) : undefined
        ),
        partner: z.string().optional(),
      }),
      player2: z.object({
        name: z.string(),
        club: z.string().optional(),
        registration_no: z.string().optional(),
        seed: z.union([z.number(), z.string()]).optional().transform(val => 
          val ? (typeof val === 'string' ? parseInt(val, 10) : val) : undefined
        ),
        partner: z.string().optional(),
      }),
      score: z.string().optional(),
      winner: z.enum(['player1', 'player2']).optional(),
      match_date: z.string().optional(),
    })),
    final_results: z.array(z.object({
      player: z.object({
        name: z.string(),
        registration_no: z.string().optional(),
        partner: z.string().optional(),
      }).optional(),
      position: z.string(),
      rank_order: z.number(),
      points_earned: z.number().optional(),
    })).transform(results => 
      // playerが存在しない要素を除外
      results.filter(result => result.player !== undefined)
    ),
  })),
});

type TournamentData = z.infer<typeof TournamentDataSchema>;

export class TournamentExtractor {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  async extractFromPDF(pdfBuffer: Buffer): Promise<TournamentData> {
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log('PDF size:', pdfBuffer.length, 'bytes');
    console.log('Sending request to Claude API...');
  
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      temperature: 0, // より一貫した出力のため
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: this.getExtractionPrompt(),
          },
        ],
      }],
    });
  
    // レスポンスから JSON を抽出
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    console.log('Raw response length:', responseText.length);
    
    // デバッグ: 最初の100000文字を表示
    console.log('Response preview:', responseText.substring(0, 100000));
    
    // JSON部分を抽出 - 複数のパターンに対応
    let jsonText = responseText;
    
    // パターン1: ```json ... ``` の形式
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // パターン2: ``` ... ``` の形式（jsonタグなし）
      const codeBlockMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      } else {
        // パターン3: JSONの開始位置を探す
        const jsonStart = responseText.indexOf('{');
        const jsonArrayStart = responseText.indexOf('[');
        
        if (jsonStart !== -1 && (jsonArrayStart === -1 || jsonStart < jsonArrayStart)) {
          jsonText = responseText.substring(jsonStart);
        } else if (jsonArrayStart !== -1) {
          jsonText = responseText.substring(jsonArrayStart);
        }
      }
    }
    
    // 改行や余分な空白を正規化
    jsonText = jsonText
      .replace(/\r\n/g, '\n')  // Windows改行をUnix改行に
      .replace(/\r/g, '\n')    // Mac改行をUnix改行に
      .replace(/\t/g, '  ')    // タブをスペースに変換
      .trim();
    
    // JSONの終端を確認（不完全なJSONの場合）
    const openBraces = (jsonText.match(/{/g) || []).length;
    const closeBraces = (jsonText.match(/}/g) || []).length;
    const openBrackets = (jsonText.match(/\[/g) || []).length;
    const closeBrackets = (jsonText.match(/\]/g) || []).length;
    
    if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
      console.warn('JSON brackets mismatch detected:', {
        openBraces, closeBraces, openBrackets, closeBrackets
      });
    }
    
    try {
      // JSONをパース
      const result = JSON.parse(jsonText);
      
      // デバッグ: パースされたオブジェクトの構造を確認
      console.log('Parsed object keys:', Object.keys(result));
      if (result.tournament) {
        console.log('Tournament info found:', result.tournament);
      }
      
      // データ正規化: よくある誤りのパターンを修正
      
      // 1. eventsキーがあってcategoriesキーがない場合
      if (result.events && !result.categories) {
        console.log('Converting "events" to "categories"');
        result.categories = result.events;
        delete result.events;
      }
      
      // 2. categoryキーがあってcategoriesキーがない場合（単数形）
      if (result.category && !result.categories) {
        console.log('Converting "category" to "categories"');
        result.categories = Array.isArray(result.category) ? result.category : [result.category];
        delete result.category;
      }
      
      // 3. トップレベルが配列の場合（tournament情報がない）
      if (Array.isArray(result) && result.length > 0) {
        console.log('Top level is array, wrapping in object');
        const tournamentInfo = {
          name: 'Unknown Tournament',
          year: new Date().getFullYear(),
        };
        
        // 配列の最初の要素から大会情報を推測
        if (result[0].tournament) {
          tournamentInfo.name = result[0].tournament.name || tournamentInfo.name;
          tournamentInfo.year = result[0].tournament.year || tournamentInfo.year;
        }
        
        const wrappedResult = {
          tournament: tournamentInfo,
          categories: result,
        };
        
        return TournamentDataSchema.parse(wrappedResult);
      }
      
      // 4. データが入れ子になっている場合
      if (result.data && typeof result.data === 'object') {
        console.log('Data is nested, extracting inner data');
        const innerData = result.data;
        if (innerData.categories) {
          result.categories = innerData.categories;
        }
        if (innerData.tournament) {
          result.tournament = innerData.tournament;
        }
      }
      
      // 5. tournamentInfoキーがある場合
      if (result.tournamentInfo && !result.tournament) {
        console.log('Converting "tournamentInfo" to "tournament"');
        result.tournament = result.tournamentInfo;
        delete result.tournamentInfo;
      }
      
      // 6. 大会情報が別のキーにある場合
      if (!result.tournament) {
        // 一般的な代替キー名をチェック
        const alternativeKeys = ['competition', 'event', 'tournamentData', 'info'];
        for (const key of alternativeKeys) {
          if (result[key] && typeof result[key] === 'object') {
            console.log(`Converting "${key}" to "tournament"`);
            result.tournament = result[key];
            delete result[key];
            break;
          }
        }
      }
      
      // 7. カテゴリーが異なるキーにある場合
      if (!result.categories) {
        // 一般的な代替キー名をチェック
        const alternativeKeys = ['divisions', 'brackets', 'draws', 'tournaments'];
        for (const key of alternativeKeys) {
          if (result[key] && Array.isArray(result[key])) {
            console.log(`Converting "${key}" to "categories"`);
            result.categories = result[key];
            delete result[key];
            break;
          }
        }
      }
      
      // 8. 結果がresultキーに入っている場合
      if (result.result && typeof result.result === 'object') {
        console.log('Extracting data from "result" key');
        const innerResult = result.result;
        if (innerResult.categories) result.categories = innerResult.categories;
        if (innerResult.tournament) result.tournament = innerResult.tournament;
      }
      
      // categoriesが存在しない場合のエラーチェック
      if (!result.categories) {
        console.error('Available keys in result:', Object.keys(result));
        console.error('Full result structure:', JSON.stringify(result, null, 2));
        
        // より詳細なデバッグ情報
        console.error('\n=== Debug Information ===');
        console.error('Result type:', typeof result);
        console.error('Is array:', Array.isArray(result));
        console.error('Keys at depth 1:', Object.keys(result));
        
        // 深さ2のキーも確認
        for (const key of Object.keys(result)) {
          if (typeof result[key] === 'object' && result[key] !== null) {
            console.error(`Keys under "${key}":`, Object.keys(result[key]));
          }
        }
        
        throw new Error(`必須フィールド "categories" が見つかりません。利用可能なキー: ${Object.keys(result).join(', ')}`);
      }
      
      // カテゴリコードからgender/typeを正規化
      result.categories = result.categories.map((category: any) => {
        if (category.category_info.code) {
          const { gender, type } = this.normalizeGenderAndType(category.category_info.code);
          
          // コードから導出した値で上書き（安全のため）
          category.category_info.gender = gender;
          category.category_info.type = type;
        }
        return category;
      });
      
      // 統計情報を表示
      console.log('\n=== 抽出結果の統計 ===');
      console.log(`カテゴリー数: ${result.categories.length}`);
      
      result.categories.forEach((category: any, index: number) => {
        console.log(`\nカテゴリー${index + 1}: ${category.category_info?.name || 'Unknown'}`);
        console.log(`  - カテゴリーコード: ${category.category_info?.code}`);
        console.log(`  - 性別: ${category.category_info?.gender}`);
        console.log(`  - 種目: ${category.category_info?.type}`);
        console.log(`  - 年齢: ${category.category_info?.age_group}歳以上`);
        console.log(`  - ドローサイズ: ${category.category_info?.draw_size}`);
        console.log(`  - 抽出された試合数: ${category.matches?.length || 0}`);
        console.log(`  - 最終結果数: ${category.final_results?.length || 0}`);
        
        // ラウンド別の試合数を集計
        if (category.matches && Array.isArray(category.matches)) {
          const roundCounts: { [key: string]: number } = {};
          category.matches.forEach((match: any) => {
            const round = match.round || 'Unknown';
            roundCounts[round] = (roundCounts[round] || 0) + 1;
          });
          console.log('  - ラウンド別試合数:');
          Object.entries(roundCounts).forEach(([round, count]) => {
            console.log(`    ${round}: ${count}試合`);
          });
          
          // ドローサイズと試合数の妥当性チェック
          const drawSize = category.category_info?.draw_size;
          const expectedMatches = drawSize ? drawSize - 1 : 0;
          const actualMatches = category.matches.filter((m: any) => 
            m.player1?.name !== 'bye' && m.player2?.name !== 'bye'
          ).length;
          
          if (expectedMatches > 0 && actualMatches !== expectedMatches) {
            console.warn(`  ⚠️  試合数の不一致: 期待値 ${expectedMatches}試合, 実際 ${actualMatches}試合`);
          }
        }
      });
      
      // スキーマで検証
      return TournamentDataSchema.parse(result);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      console.error('JSON Text (first 500 chars):', jsonText.substring(0, 500));
      console.error('JSON Text (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));
      
      // エラーの詳細を投げる
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', JSON.stringify(error.errors, null, 2));
        throw new Error(`データ検証エラー: ${JSON.stringify(error.errors)}`);
      } else if (error instanceof SyntaxError) {
        // JSON構文エラーの場合、より詳細な情報を提供
        const match = error.message.match(/position (\d+)/);
        if (match) {
          const position = parseInt(match[1], 10);
          const start = Math.max(0, position - 100);
          const end = Math.min(jsonText.length, position + 100);
          console.error(`JSON syntax error near position ${position}:`);
          console.error(jsonText.substring(start, end));
        }
        throw new Error(`JSON解析エラー: ${error.message}`);
      } else {
        throw error;
      }
    }
  }

  private normalizeGenderAndType(categoryCode: string): { gender: 'male' | 'female', type: 'singles' | 'doubles' } {
    const gender = categoryCode.startsWith('g') ? 'male' : 'female';
    const type = categoryCode.includes('s') ? 'singles' : 'doubles';
    return { gender, type };
  }

  private getExtractionPrompt(): string {
    return `このPDFはJTAベテランテニス大会のトーナメント結果表です。男女と年齢別の複数のカテゴリ(男子シングルス35歳以上、など)が含まれており、各カテゴリは通常は別々のページに記載されています。PDFの全ページを必ず確認し、各カテゴリごとの、トーナメントの結果情報を抽出してJSON形式で返してください：

重要な指示:
1. PDFの全ページを確認し、すべてのカテゴリのトーナメントを抽出してください。例えば、3ページある場合は、3カテゴリあることが多いです。
  - 1つのPDFに、複数のカテゴリ（年齢別、性別、シングルス/ダブルス）が含まれています。
  - 各ページの上部にカテゴリ名（例：男子シングルス 35歳以上、女子ダブルス 50歳以上など）が記載されているので正確に抽出してください。
  - すべてのカテゴリを見逃さないよう、最初から最後のページまで確認してください。
  - カテゴリー毎に、トーナメント形式の試合の結果があります。
   カテゴリーコードの規則:
    - 性別: g=男子(gentlemen), l=女子(ladies)
    - 種目: s=シングルス, d=ダブルス
    - 年齢: 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85
    - 例：gs35（男子シングルス35歳以上）、ld70（女子ダブルス70歳以上）
2. トーナメント表に記載された全ての選手情報、対戦結果、各選手の成績を記録してください。トーナメント表形式で、一番左から一回戦がはじまり、選手名の間に線が引かれており、勝者が次のラウンドに進む形式です。
3. 選手情報の抽出：
  - 登録番号（registration_no）は必ず記録（例：G0023470）
  - 選手名は姓名を正確に抽出
  - 所属クラブ名も正確に記録
  - seed番号(ある場合)は数値として記載
  - 既存のPlayerテーブルと照合できるよう、これらの情報は正確に
4. ドロー番号(1番から16番など、ある場合)、すべての対戦を漏れなく記録。16ドローの場合、以下の試合数が必要です：
   - 1回戦（1R）: 8試合（16人→8人）
   - 準々決勝（QF）: 4試合（8人→4人）
   - 準決勝（SF）: 2試合（4人→2人）
   - 決勝（F）: 1試合（2人→1人）
   - 合計: 15試合
   - Byeがある場合、そこは選手がいないので、その分試合数が減ります。
4. 「bye」のところは選手がいない枠で、その場合、試合が行われず、byeではない選手が勝ち上がります。両方byeの場合は試合がありません
5. 最終的に勝ち上がった人が優勝。負けた人は準優勝、ベスト4, ベスト8と続きます。トーナメントの最後まで勝ち進んだ選手からベスト何なのかを特定してください。初戦で負けた人は、全て"初戦敗退"となります。2回戦スタートでも初戦負けとなりポイントがつきません。一回でも勝てた人は、ドロー数の大きさに応じて、ベスト16やベスト8などになります。
7. 試合のスコアの例はとして、"61 61", "36 62 62", "76(2) 75"。括弧があるのはタイブレークです。"W.O."は"ウォークオーバー"で欠場を意味します。- "W.O." （ウォークオーバー)で欠場、"RET" (リタイア)は試合途中の棄権です。数字なしの勝敗記録もありえます。
8. ダブルスの場合の注意：
    - player1とplayer2の両方にpartner情報を含める
    - 選手名の下にペアの選手名が記載されている場合があります

必ず以下の構造のJSONに整理して、JASONのみを返してください：

{
  "tournament": {
    "name": "大会名",
    "year": 開催年（数値）,
    "round": 第何回大会か（数値、わからない場合は省略）,
    "venue": "開催地/会場（わからない場合は省略）",
    "start_date": "開始日（YYYY-MM-DD形式、わからない場合は省略）",
    "end_date": "終了日（YYYY-MM-DD形式、わからない場合は省略）"
  },
  "categories": [
    {
      "category_info": {
        "name": "カテゴリー名（例：男子シングルス35歳以上）",
        "code": "カテゴリーコード（例：gs35 = 男子シングルス35歳以上）",
        "gender": "male" または "female",  // male=男子, female=女子
        "type": "singles" または "doubles", // singles=シングルス, doubles=ダブルス
        "age_group": 年齢グループ（35, 40, 45等の数値）,
        "draw_size": ドローサイズ（16, 32, 64, 128等）
      },
      "matches": [
        {
          "round": "ラウンド（1R, 2R, 3R, QF, SF, F等）",
          "match_number": 試合番号（表に記載がある場合）,
          "player1": {
            "name": "選手名",
            "club": "所属クラブ",
            "registration_no": "登録番号（例：G0023470）",
            "seed": シード番号（ある場合、数値で記載）,
            "partner": "パートナー名（ダブルスの場合）"
          },
          "player2": {
            "name": "選手名",
            "club": "所属クラブ",
            "registration_no": "登録番号",
            "seed": シード番号（ある場合、数値で記載）,
            "partner": "パートナー名（ダブルスの場合）"
          },
          "score": "スコア（例：61 61, 36 62 62, 76(2) 75、括弧があるのはタイブレーク）",
          "winner": "player1" または "player2"
        }
      ],
      "final_results": [
        {
          "player": {
            "name": "選手名",
            "registration_no": "登録番号",
            "partner": "パートナー名（ダブルスの場合）"
          },
          "position": "すべての選手の順位をつける、上から優勝/準優勝/ベスト4/ベスト8/ベスト16など続き、一回も勝てなかった選手は初戦敗退",
          "rank_order": 順位番号（1, 2, 3, 5等）,
          "points_earned": 獲得ポイント（わかる場合）
        }
      ]
    }
  ]
}

注意点：
- PDFのトーナメント表で、byeでない全ての対戦を漏れなく抽出
- 1番の選手から16番の選手まで、順番に確認
- トーナメント表に記載されているスコアを必ず含める
- 純粋なJSONのみを返し、説明文やコメントは含めない`;
  }

  async saveToDatabase(data: TournamentData): Promise<void> {
    console.log(`\n=== データベース保存開始 ===`);
    console.log(`大会: ${data.tournament.name} (${data.tournament.year}年)`);
    console.log(`カテゴリ数: ${data.categories.length}`);

    const savedCategories: string[] = [];
    const skippedCategories: string[] = [];
    const errors: Array<{ category: string, error: string }> = [];
    
    // トランザクションで保存
    await prisma.$transaction(async (tx) => {
      // 1. Tournament作成または更新
      const tournament = await tx.tournament.upsert({
        where: {
          name_year: {
            name: data.tournament.name,
            year: data.tournament.year,
          },
        },
        create: {
          name: data.tournament.name,
          year: data.tournament.year,
          round: data.tournament.round,
          venue: data.tournament.venue,
          startDate: data.tournament.start_date ? new Date(data.tournament.start_date) : undefined,
          endDate: data.tournament.end_date ? new Date(data.tournament.end_date) : undefined,
        },
        update: {
          round: data.tournament.round,
          venue: data.tournament.venue,
          startDate: data.tournament.start_date ? new Date(data.tournament.start_date) : undefined,
          endDate: data.tournament.end_date ? new Date(data.tournament.end_date) : undefined,
        },
      });
  
      console.log('Tournament created/updated:', tournament);
  
      // 2. 各カテゴリーを処理
      for (const categoryData of data.categories) {
        try {
          // 既存のカテゴリーをチェック
          const existingCategory = await tx.tournamentCategory.findUnique({
            where: {
              tournamentId_categoryCode: {
                tournamentId: tournament.id,
                categoryCode: categoryData.category_info.code,
              },
            },
          });
  
          if (existingCategory) {
            skippedCategories.push(categoryData.category_info.name);
            console.log(`Category ${categoryData.category_info.code} already exists, skipping...`);
            continue;
          }
  
          const category = await tx.tournamentCategory.create({
            data: {
              tournamentId: tournament.id,
              categoryCode: categoryData.category_info.code,
              gender: categoryData.category_info.gender,
              type: categoryData.category_info.type,
              ageGroup: categoryData.category_info.age_group,
              drawSize: categoryData.category_info.draw_size,
            },
          });
  
          console.log('Category created:', category);
  
          // 選手を解決
          const playerMap = await this.resolvePlayers(tx, categoryData);
  
          // 試合を保存
          for (const match of categoryData.matches) {
            await this.createMatch(tx, category.id, match, playerMap);
          }
  
          // 最終成績を保存  
          for (const result of categoryData.final_results) {
            await this.createResult(tx, category.id, result, playerMap);
          }
          
          savedCategories.push(categoryData.category_info.name);
        } catch (error: any) {
          errors.push({
            category: categoryData.category_info.name,
            error: error.message
          });
          console.error(`カテゴリ ${categoryData.category_info.name} の保存エラー:`, error);
          // エラーがあってもトランザクション全体を失敗させない場合はcontinue
          // throw error; // トランザクション全体を失敗させる場合
          throw error; // トランザクション全体を失敗させる
        }
      }
    });

    // 保存結果のサマリー
    console.log(`\n=== 保存結果 ===`);
    console.log(`✅ 保存成功: ${savedCategories.length}カテゴリ`);
    savedCategories.forEach(cat => console.log(`  - ${cat}`));
    
    if (skippedCategories.length > 0) {
      console.log(`⏭️  スキップ（既存）: ${skippedCategories.length}カテゴリ`);
      skippedCategories.forEach(cat => console.log(`  - ${cat}`));
    }
    
    if (errors.length > 0) {
      console.log(`❌ エラー: ${errors.length}カテゴリ`);
      errors.forEach(({ category, error }) => console.log(`  - ${category}: ${error}`));
    }
  }

  private async resolvePlayers(
    tx: any,
    categoryData: any
  ): Promise<Map<string, number>> {
    const playerMap = new Map<string, number>();
    const registrationNos = new Set<string>();
    const unresolvedPlayers: Array<{
      name: string;
      club?: string;
      registrationNo?: string;
      source: string;
    }> = [];

    // デバッグ情報
    console.log(`\nカテゴリ: ${categoryData.category_info.name}`);
    console.log(`選手解決開始...`);

    // 全選手の登録番号を収集
    categoryData.matches.forEach((match: any) => {
      // Player1の処理
      if (match.player1.name !== 'bye' && match.player1.name) {
        if (match.player1.registration_no) {
          registrationNos.add(match.player1.registration_no);
        } else {
          unresolvedPlayers.push({
            name: match.player1.name,
            club: match.player1.club,
            registrationNo: match.player1.registration_no,
            source: `match-${match.round}-player1`
          });
        }
      }
      
      // Player2の処理
      if (match.player2.name !== 'bye' && match.player2.name) {
        if (match.player2.registration_no) {
          registrationNos.add(match.player2.registration_no);
        } else {
          unresolvedPlayers.push({
            name: match.player2.name,
            club: match.player2.club,
            registrationNo: match.player2.registration_no,
            source: `match-${match.round}-player2`
          });
        }
      }
    });

    categoryData.final_results.forEach((result: any) => {
      if (result.player && result.player.registration_no) {
        registrationNos.add(result.player.registration_no);
      } else if (result.player) {
        unresolvedPlayers.push({
          name: result.player.name,
          registrationNo: result.player.registration_no,
          source: `final-result-${result.position}`
        });
      }
    });

    let createdCount = 0;

    // 既存選手を検索
    if (registrationNos.size > 0) {
      try {
        const existingPlayers = await tx.player.findMany({
          where: {
            registrationNo: {
              in: Array.from(registrationNos),
            },
          },
        });

        // マップに追加
        existingPlayers.forEach((player: any) => {
          playerMap.set(player.registrationNo, player.id);
        });

        // 見つからなかった登録番号を特定
        const foundRegistrationNos = new Set(existingPlayers.map((p: any) => p.registrationNo));
        const notFoundRegistrationNos = Array.from(registrationNos).filter(
          regNo => !foundRegistrationNos.has(regNo)
        );

        if (notFoundRegistrationNos.length > 0) {
          console.warn(`登録番号が見つからない選手: ${notFoundRegistrationNos.join(', ')}`);
          
          // 登録番号はあるが見つからない選手を新規作成
          for (const regNo of notFoundRegistrationNos) {
            // 該当する選手情報を探す
            let playerInfo = null;
            
            // matchesから探す
            for (const match of categoryData.matches) {
              if (match.player1.registration_no === regNo) {
                playerInfo = match.player1;
                break;
              }
              if (match.player2.registration_no === regNo) {
                playerInfo = match.player2;
                break;
              }
            }
            
            // final_resultsから探す
            if (!playerInfo) {
              const result = categoryData.final_results.find(
                (r: any) => r.player && r.player.registration_no === regNo
              );
              if (result) {
                playerInfo = result.player;
              }
            }

            // 選手情報が見つかった場合、新規作成
            if (playerInfo && playerInfo.name) {
              try {
                const newPlayer = await tx.player.create({
                  data: {
                    registrationNo: regNo,
                    name: playerInfo.name,
                    club: playerInfo.club || null,
                    prefecture: this.extractPrefecture(playerInfo.club),
                  },
                });
                playerMap.set(regNo, newPlayer.id);
                createdCount++;
                console.log(`新規選手作成: ${playerInfo.name} (${regNo})`);
              } catch (error) {
                console.error(`選手作成エラー: ${playerInfo.name} (${regNo})`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error('既存選手の検索でエラー:', error);
        throw error;
      }
    }

    // 登録番号がない選手の処理
    if (unresolvedPlayers.length > 0) {
      console.warn('登録番号がない選手一覧:');
      const groupedByName = unresolvedPlayers.reduce((acc, player) => {
        if (!acc[player.name]) {
          acc[player.name] = [];
        }
        acc[player.name].push(player);
        return acc;
      }, {} as Record<string, typeof unresolvedPlayers>);

      Object.entries(groupedByName).forEach(([name, players]) => {
        console.warn(`  - ${name}: ${players.map(p => p.source).join(', ')}`);
        if (players[0].club) {
          console.warn(`    所属: ${players[0].club}`);
        }
      });

      // 必要に応じて、名前ベースでの既存選手検索も可能
      // ただし、同姓同名の問題があるため、慎重に行う必要がある
    }

    // 統計情報
    const stats = {
      total: registrationNos.size + unresolvedPlayers.length,
      resolved: playerMap.size,
      unresolved: unresolvedPlayers.length,
      created: createdCount,
    };

    console.log(`選手解決完了: 全${stats.total}名中、${stats.resolved}名解決（新規${stats.created}名）、${stats.unresolved}名未解決`);

    return playerMap;
  }

  private extractPrefecture(club?: string): string | null {
    if (!club) return null;
    
    // 都道府県名のリスト
    const prefectures = [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
      '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
      '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
      '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ];
    
    // 所属クラブ名から都道府県を抽出
    for (const pref of prefectures) {
      if (club.includes(pref.replace('県', '').replace('府', '').replace('都', ''))) {
        return pref;
      }
    }
    
    return null;
  }

  private async createMatch(
    tx: any,
    categoryId: number,
    matchData: any,
    playerMap: Map<string, number>
  ): Promise<void> {
    // byeの試合はスキップ
    if (matchData.player1.name === 'bye' || matchData.player2.name === 'bye' || 
        matchData.player1.name.toLowerCase() === 'bye' || matchData.player2.name.toLowerCase() === 'bye') {
      return;
    }

    const player1Id = matchData.player1.registration_no
      ? playerMap.get(matchData.player1.registration_no)
      : null;
    const player2Id = matchData.player2.registration_no
      ? playerMap.get(matchData.player2.registration_no)
      : null;

    // 両方の選手IDがない場合はスキップ（データ品質の問題）
    if (!player1Id && !player2Id) {
      console.warn('両選手のIDが解決できません:', {
        player1: matchData.player1.name,
        player2: matchData.player2.name,
        round: matchData.round
      });
      return;
    }

    // seed値が文字列の場合は数値に変換
    const player1Seed = matchData.player1.seed ? 
      (typeof matchData.player1.seed === 'string' ? parseInt(matchData.player1.seed, 10) : matchData.player1.seed) : 
      null;
    const player2Seed = matchData.player2.seed ? 
      (typeof matchData.player2.seed === 'string' ? parseInt(matchData.player2.seed, 10) : matchData.player2.seed) : 
      null;

    // スコアの正規化（W.O.やRETも含む）
    let normalizedScore = matchData.score;
    if (normalizedScore) {
      // 全角スペースを半角に変換
      normalizedScore = normalizedScore.replace(/　/g, ' ');
      // 複数スペースを単一スペースに
      normalizedScore = normalizedScore.replace(/\s+/g, ' ').trim();
    }

    try {
      await tx.match.create({
        data: {
          categoryId,
          round: matchData.round,
          matchNumber: matchData.match_number,
          player1Id,
          player1Seed,
          player1Partner: matchData.player1.partner,
          player2Id,
          player2Seed,
          player2Partner: matchData.player2.partner,
          score: normalizedScore,
          winner: matchData.winner,
          matchDate: matchData.match_date ? new Date(matchData.match_date) : null,
        },
      });
    } catch (error) {
      console.error('試合作成エラー:', error);
      console.error('試合データ:', matchData);
      throw error;
    }
  }

  private async createResult(
    tx: any,
    categoryId: number,
    resultData: any,
    playerMap: Map<string, number>
  ): Promise<void> {
    if (!resultData.player) {
      console.warn('Result without player data:', resultData);
      return;
    }

    const playerId = resultData.player.registration_no
      ? playerMap.get(resultData.player.registration_no)
      : null;

    if (!playerId) {
      console.warn('選手IDが解決できません:', {
        name: resultData.player.name,
        position: resultData.position
      });
      return;
    }

    try {
      await tx.tournamentResult.create({
        data: {
          categoryId,
          playerId,
          partnerName: resultData.player.partner,
          finalPosition: resultData.position,
          rankOrder: resultData.rank_order,
          pointsEarned: resultData.points_earned,
        },
      });
    } catch (error) {
      console.error('結果作成エラー:', error);
      console.error('結果データ:', resultData);
      throw error;
    }
  }
}