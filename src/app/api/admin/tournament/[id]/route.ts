// src/app/api/admin/tournament/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = parseInt(params.id);

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        categories: {
          include: {
            results: {
              include: {
                player: {
                  select: {
                    id: true,
                    name: true,
                    registrationNo: true,
                  }
                }
              },
              orderBy: {
                rankOrder: 'asc'
              }
            },
            _count: {
              select: {
                matches: true
              }
            }
          },
          orderBy: [
            { gender: 'asc' },
            { type: 'asc' },
            { ageGroup: 'asc' }
          ]
        }
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: '大会が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament detail:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}