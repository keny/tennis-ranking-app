// src/app/api/admin/tournament/[id]/category/[categoryId]/matches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    const categoryId = parseInt(params.categoryId);

    const category = await prisma.tournamentCategory.findUnique({
      where: { id: categoryId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            year: true,
          }
        },
        matches: {
          include: {
            player1: {
              select: {
                id: true,
                name: true,
                registrationNo: true,
              }
            },
            player2: {
              select: {
                id: true,
                name: true,
                registrationNo: true,
              }
            }
          },
          orderBy: [
            { round: 'asc' },
            { matchNumber: 'asc' }
          ]
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'カテゴリーが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category matches:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}