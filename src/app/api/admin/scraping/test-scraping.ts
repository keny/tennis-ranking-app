import { generateArchivePeriods, generateArchiveUrl, generateAllArchiveUrls } from './archive-utils'

export function testArchiveUtils() {
  // 全アーカイブ期間を取得
  const periods = generateArchivePeriods()
  console.log(`総期間数: ${periods.length}`)

  // 特定期間・カテゴリのURL生成
  const url = generateArchiveUrl(
    { 
      year: 2024, 
      month: 12, 
      urlPath: '202412vet',
      displayName: '2024年12月',
      startDate: new Date(2024, 11, 1),
      endDate: new Date(2024, 11, 31)
    },
    'gs45'
  )
  console.log(`URL: ${url}`)

  // 全URL生成（期間×カテゴリ）
  const allUrls = generateAllArchiveUrls()
  console.log(`総URL数: ${allUrls.length}`)
}

// 実行する場合
// testArchiveUtils()