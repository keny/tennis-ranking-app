// app/api/admin/scraping/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { CATEGORIES } from '@/lib/scraping/archive-utils'

export async function GET() {
  try {
    const categories = Object.entries(CATEGORIES).map(([code, info]) => ({
      code,
      ...info
    }))
    
    return NextResponse.json({
      categories,
      byGender: {
        male: categories.filter(c => c.gender === 'male'),
        female: categories.filter(c => c.gender === 'female')
      },
      byType: {
        singles: categories.filter(c => c.type === 'singles'),
        doubles: categories.filter(c => c.type === 'doubles')
      }
    })
  } catch (error) {
    console.error('Categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}