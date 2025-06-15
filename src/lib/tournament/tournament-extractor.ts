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
    })),
    final_results: z.array(z.object({
      player: z.object({
        name: z.string(),
        registration_no: z.string().optional(),
        partner: z.string().optional(),
      }).optional(),
      position: z.string(),
      rank_order: z.number(),
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
    
    console.log('Raw response length:', responseText.length); // デバッグ用
    console.log('Full parsed data:', JSON.stringify(responseText, null, 2)); // デバッグ用
    
    // JSON部分を抽出
    let jsonText = responseText;
    
    // ```json ... ``` の形式の場合
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // JSONの開始位置を探す
      const jsonStart = responseText.indexOf('{');
      if (jsonStart !== -1) {
        jsonText = responseText.substring(jsonStart);
      }
    }
    
    // 改行や余分な空白を正規化
    jsonText = jsonText
      .replace(/\r\n/g, '\n')  // Windows改行をUnix改行に
      .replace(/\r/g, '\n')    // Mac改行をUnix改行に
      .trim();
    
    try {
      // JSONをパース
      const result = JSON.parse(jsonText);
      
      // デバッグ用：抽出されたデータの統計を表示
      console.log('\n=== 抽出結果の統計 ===');
      if (result.categories && result.categories.length > 0) {
        result.categories.forEach((category: any, index: number) => {
          console.log(`カテゴリー${index + 1}: ${category.category_info?.name || 'Unknown'}`);
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
          }
        });
      }
      
      // ここでデータ正規化を行う
      // eventsキーがあってcategoriesキーがない場合、eventsをcategoriesに変換
      if (result.events && !result.categories) {
        console.log('Converting "events" to "categories"');
        result.categories = result.events;
        delete result.events;
      }
      
      // categoriesが存在しない場合のエラーチェック
      if (!result.categories) {
        throw new Error('必須フィールド "categories" が見つかりません');
      }
      
      // スキーマで検証
      return TournamentDataSchema.parse(result);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      console.error('JSON Text (first 500 chars):', jsonText.substring(0, 500));
      
      // エラーの詳細を投げる
      if (error instanceof z.ZodError) {
        throw new Error(`データ検証エラー: ${JSON.stringify(error.errors)}`);
      } else if (error instanceof SyntaxError) {
        throw new Error(`JSON解析エラー: ${error.message}`);
      } else {
        throw error;
      }
    }
  }

  private getExtractionPrompt(): string {
    return `このPDFはJTAベテランテニス大会のトーナメント結果表です。トーナメント表形式で、選手名の間に線が引かれており、勝者が次のラウンドに進む形式です。

    PDFの全ページを必ず確認し、以下の情報を抽出してJSON形式で返してください：
    
    重要な指示:
    1. トーナメント表の各ボックスに記載された全ての選手対戦を試合として記録
    2. 16ドローの場合、以下の試合数が必要です：
       - 1回戦（1R）: 8試合（16人→8人）
       - 準々決勝（QF）: 4試合（8人→4人）
       - 準決勝（SF）: 2試合（4人→2人）
       - 決勝（F）: 1試合（2人→1人）
       - 合計: 15試合
    3. 選手番号1番から16番まで、すべての対戦を漏れなく記録
    4. 「bye」の選手は試合として記録しない
    
    1. 大会情報
       - name: 大会名
       - year: 開催年（数値）
       - round: 第何回大会か（数値、わからない場合は省略）
       - venue: 開催地/会場（わからない場合は省略）
    
    2. 各カテゴリーごとに：
       - category_info:
         - name: カテゴリー名（例：男子シングルス35歳以上）
         - code: カテゴリーコード（例：gs35 = 男子シングルス35歳以上）
           規則: [性別][種目][年齢]
           性別: g=男子(gentlemen), l=女子(ladies)
           種目: s=シングルス, d=ダブルス
           年齢: 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85
         - gender: "male" または "female"
         - type: "singles" または "doubles"
         - age_group: 年齢グループ（35, 40, 45等の数値）
         - draw_size: ドローサイズ（16, 32, 64, 128等）
       
       - matches: トーナメント表の全試合（重要：各ラウンドの全試合を含める）
         トーナメント表の上から下まで、すべての対戦を記録:
         
         各試合の情報:
         - round: ラウンド（"1R", "2R", "3R", "QF", "SF", "F"等）
         - match_number: 試合番号（表に記載がある場合）
         - player1: 上側の選手
           - name: 選手名
           - club: 所属クラブ
           - registration_no: 登録番号（例：G0023470）
           - seed: シード番号（ある場合、数値で記載）
         - player2: 下側の選手（同様の情報）
         - score: スコア（選手名の横に記載、例："61 61", "36 62 62"）
         - winner: 勝者が次のラウンドに進んでいる方（"player1" または "player2"）
       
       - final_results: 最終成績（ベスト8以上の選手）
         PDFの右側に記載されている成績:
         - player: 選手情報
         - position: "優勝", "準優勝", "ベスト4", "ベスト8"等
         - rank_order: 順位番号（1, 2, 3, 5等）
    
    注意点：
    - PDFのトーナメント表で、byeでない全ての対戦を漏れなく抽出
    - 1番の選手から16番の選手まで、順番に確認
    - 選手名の横に記載されているスコアを必ず含める
    - seedは数値として記載
    
    必ず有効なJSON形式で返してください。`;
    
}

  async saveToDatabase(data: TournamentData): Promise<void> {
    console.log('Saving tournament data:', JSON.stringify(data, null, 2));
    
    // Prismaクライアントの確認
    console.log('Prisma models available:', Object.keys(prisma));
    
    // トランザクションで保存
    await prisma.$transaction(async (tx) => {
      console.log('Transaction context models:', Object.keys(tx));
      
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
        },
        update: {
          round: data.tournament.round,
          venue: data.tournament.venue,
        },
      });
  
      console.log('Tournament created/updated:', tournament);
  
      // 2. 各カテゴリーを処理
      for (const categoryData of data.categories) {
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
      }
    });
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

    // 全選手の登録番号を収集
    categoryData.matches.forEach((match: any) => {
      // Player1の処理
      if (match.player1.name !== 'bye') {
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
      if (match.player2.name !== 'bye') {
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
          
          // 登録番号はあるが見つからない選手を新規作成するかどうか
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
                  },
                });
                playerMap.set(regNo, newPlayer.id);
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

    console.log(`解決済み選手数: ${playerMap.size}`);
    console.log(`未解決選手数: ${unresolvedPlayers.length}`);

    return playerMap;
  }

  private async createMatch(
    tx: any,
    categoryId: number,
    matchData: any,
    playerMap: Map<string, number>
  ): Promise<void> {
    // byeの試合はスキップ
    if (matchData.player1.name === 'bye' || matchData.player2.name === 'bye') {
      return;
    }

    const player1Id = matchData.player1.registration_no
      ? playerMap.get(matchData.player1.registration_no)
      : null;
    const player2Id = matchData.player2.registration_no
      ? playerMap.get(matchData.player2.registration_no)
      : null;

    // seed値が文字列の場合は数値に変換（スキーマで変換済みだが念のため）
    const player1Seed = matchData.player1.seed ? 
      (typeof matchData.player1.seed === 'string' ? parseInt(matchData.player1.seed, 10) : matchData.player1.seed) : 
      null;
    const player2Seed = matchData.player2.seed ? 
      (typeof matchData.player2.seed === 'string' ? parseInt(matchData.player2.seed, 10) : matchData.player2.seed) : 
      null;

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
        score: matchData.score,
        winner: matchData.winner,
      },
    });
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

    if (playerId) {
      await tx.tournamentResult.create({
        data: {
          categoryId,
          playerId,
          finalPosition: resultData.position,
          rankOrder: resultData.rank_order,
        },
      });
    }
  }
}