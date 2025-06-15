// scripts/check-tournament-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTournamentData() {
  try {
    // トーナメント一覧
    const tournaments = await prisma.tournament.findMany({
      include: {
        _count: {
          select: {
            categories: true
          }
        }
      }
    });
    
    console.log('=== トーナメント一覧 ===');
    tournaments.forEach(t => {
      console.log(`${t.id}: ${t.name} (${t.year}年) - ${t._count.categories}カテゴリー`);
    });

    // カテゴリー詳細
    const categories = await prisma.tournamentCategory.findMany({
      include: {
        _count: {
          select: {
            matches: true,
            results: true
          }
        }
      }
    });

    console.log('\n=== カテゴリー詳細 ===');
    categories.forEach(c => {
      console.log(`カテゴリー: ${c.categoryCode} (${c.drawSize}ドロー)`);
      console.log(`  試合数: ${c._count.matches}`);
      console.log(`  結果数: ${c._count.results}`);
    });

    // 試合データの詳細
    const matches = await prisma.match.findMany({
      include: {
        player1: true,
        player2: true,
        category: {
          include: {
            tournament: true
          }
        }
      }
    });

    console.log('\n=== 保存されている試合 ===');
    matches.forEach(m => {
      console.log(`${m.category.tournament.name} - ${m.category.categoryCode}`);
      console.log(`  ${m.round}: ${m.player1?.name || 'BYE'} vs ${m.player2?.name || 'BYE'}`);
      console.log(`  スコア: ${m.score || 'N/A'}`);
      console.log('---');
    });

    console.log(`\n総試合数: ${matches.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTournamentData();