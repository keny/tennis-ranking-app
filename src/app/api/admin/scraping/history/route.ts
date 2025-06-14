// app/api/admin/scraping/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const categoryCode = searchParams.get('categoryCode')
    const success = searchParams.get('success')

    const where: any = {}
    if (categoryCode) where.categoryCode = categoryCode
    if (success !== null) where.success = success === 'true'

    const [logs, total] = await Promise.all([
      prisma.scrapingLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          archivePeriod: true
        }
      }),
      prisma.scrapingLog.count({ where })
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
