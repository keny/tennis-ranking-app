import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rankings = await prisma.player.findMany({
      include: {
        rankings: {
          where: {
            category: 'gs45',
            rankingDate: new Date('2025-04-30')
          },
          orderBy: {
            rankPosition: 'asc'
          }
        }
      }
    })

    // ランキングデータがある選手のみフィルター
    const playersWithRankings = rankings.filter(player => player.rankings.length > 0)

    return NextResponse.json(playersWithRankings)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 })
  }
}