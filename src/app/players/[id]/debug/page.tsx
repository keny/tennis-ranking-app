import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function PlayerDebugPage({ params }: PageProps) {
  const playerId = parseInt(params.id);
  
  if (isNaN(playerId)) {
    return <div>Invalid player ID</div>;
  }

  try {
    // 選手情報を取得
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return <div>Player not found</div>;
    }

    // 最新のランキングを1件取得
    const latestRanking = await prisma.ranking.findFirst({
      where: { playerId },
      orderBy: { rankingDate: 'desc' },
    });

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Player Debug Info</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Player Data Structure:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(player, null, 2)}
          </pre>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Player Fields:</h2>
          <ul className="list-disc list-inside">
            {Object.entries(player).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {typeof value} = {JSON.stringify(value)}
              </li>
            ))}
          </ul>
        </div>

        {latestRanking && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Latest Ranking:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(latestRanking, null, 2)}
            </pre>
          </div>
        )}
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