// src/app/api/admin/tournament/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');

    const where = year && year !== 'all' 
      ? { year: parseInt(year) }
      : {};

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        _count: {
          select: {
            categories: true
          }
        }
      }
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}