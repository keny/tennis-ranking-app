'use client';

interface Player {
  id: number;
  registrationNo: string;
  name: string;
  club: string | null;
  prefecture: string | null;
}

interface Ranking {
  gender: string;
  type: string;
  ageGroup: number;
  rankPosition: number;
  totalPoints: number;
}

interface PlayerInfoProps {
  player: Player;
  latestRankings: Ranking[];
}

export default function PlayerInfo({ player, latestRankings = [] }: PlayerInfoProps) {
  const genderMap: Record<string, string> = { male: '男子', female: '女子' };
  const typeMap: Record<string, string> = { singles: 'シングルス', doubles: 'ダブルス' };

  if (!player) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">選手情報が読み込めません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">選手プロフィール</h2>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-600">登録番号</label>
          <p className="font-medium">{player.registrationNo}</p>
        </div>
        
        <div>
          <label className="text-sm text-gray-600">氏名</label>
          <p className="font-medium text-lg">{player.name}</p>
        </div>
        
        {player.club && (
          <div>
            <label className="text-sm text-gray-600">所属</label>
            <p className="font-medium">{player.club}</p>
          </div>
        )}
        
        {player.prefecture && (
          <div>
            <label className="text-sm text-gray-600">都道府県</label>
            <p className="font-medium">{player.prefecture}</p>
          </div>
        )}
      </div>

      {latestRankings.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-3">現在のランキング</h3>
          <div className="space-y-2">
            {latestRankings.map((ranking, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="text-sm font-medium">
                    {genderMap[ranking.gender] || ranking.gender} {typeMap[ranking.type] || ranking.type} {ranking.ageGroup}歳以上
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{ranking.rankPosition}位</p>
                  <p className="text-sm text-gray-600">{ranking.totalPoints.toLocaleString()}pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}