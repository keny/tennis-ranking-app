// scripts/delete-tournament-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTournamentData(tournamentId: number) {
  try {
    console.log(`トーナメントID ${tournamentId} のデータを削除中...`);
    
    // カスケード削除（関連データも含めて削除）
    const tournament = await prisma.tournament.delete({
      where: { id: tournamentId }
    });
    
    console.log(`削除完了: ${tournament.name} (${tournament.year}年)`);
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const tournamentId = parseInt(process.argv[2]);
if (!tournamentId) {
  console.error('使用方法: npx tsx scripts/delete-tournament-data.ts <トーナメントID>');
  process.exit(1);
}

deleteTournamentData(tournamentId);