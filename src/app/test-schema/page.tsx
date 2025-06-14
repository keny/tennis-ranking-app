import { prisma } from '@/lib/prisma';

// スキーマ構造を確認するためのテストページ
export default async function TestSchemaPage() {
  try {
    // ランキングテーブルから1件取得してフィールドを確認
    const sampleRanking = await prisma.ranking.findFirst();
    
    // プレイヤーテーブルから1件取得してフィールドを確認
    const samplePlayer = await prisma.player.findFirst();

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Prisma Schema Structure Test</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Ranking Table Fields:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {sampleRanking ? JSON.stringify(sampleRanking, null, 2) : 'No ranking data found'}
          </pre>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Player Table Fields:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {samplePlayer ? JSON.stringify(samplePlayer, null, 2) : 'No player data found'}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Available Fields:</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Ranking fields:</h3>
              <ul className="list-disc list-inside">
                {sampleRanking && Object.keys(sampleRanking).map(key => (
                  <li key={key}>{key}: {typeof (sampleRanking as any)[key]}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Player fields:</h3>
              <ul className="list-disc list-inside">
                {samplePlayer && Object.keys(samplePlayer).map(key => (
                  <li key={key}>{key}: {typeof (samplePlayer as any)[key]}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <pre className="bg-red-100 p-4 rounded">
          {error instanceof Error ? error.message : 'Unknown error'}
        </pre>
      </div>
    );
  }
}