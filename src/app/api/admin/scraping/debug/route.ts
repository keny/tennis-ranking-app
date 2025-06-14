// src/app/api/admin/scraping/debug/route.ts
import { NextResponse } from 'next/server'
import { testDebug } from '@/lib/scraping/debug-scraper'

export async function GET() {
  await testDebug()
  return NextResponse.json({ message: 'Check console logs' })
}