// src/app/admin/tournament/[id]/category/[categoryId]/matches/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Trophy, Swords } from 'lucide-react';

interface MatchDetail {
  id: number;
  round: string;
  matchNumber?: number;
  score?: string;
  winner?: string;
  player1?: {
    id: number;
    name: string;
    registrationNo: string;
  };
  player1Seed?: number;
  player1Partner?: string;
  player2?: {
    id: number;
    name: string;
    registrationNo: string;
  };
  player2Seed?: number;
  player2Partner?: string;
}

interface CategoryDetail {
  id: number;
  categoryCode: string;
  gender: string;
  type: string;
  ageGroup: number;
  drawSize: number;
  tournament: {
    id: number;
    name: string;
    year: number;
  };
  matches: MatchDetail[];
}

const ROUND_ORDER = ['1R', '2R', '3R', '4R', 'QF', 'SF', 'F'];

export default function CategoryMatchesPage() {
  const params = useParams();
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id && params.categoryId) {
      fetchCategoryMatches();
    }
  }, [params.id, params.categoryId]);

  const fetchCategoryMatches = async () => {
    try {
      const response = await fetch(
        `/api/admin/tournament/${params.id}/category/${params.categoryId}/matches`
      );
      const data = await response.json();
      setCategory(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = () => {
    if (!category) return '';
    const genderName = category.gender === 'male' ? '男子' : '女子';
    const typeName = category.type === 'singles' ? 'シングルス' : 'ダブルス';
    return `${genderName}${typeName}${category.ageGroup}歳以上`;
  };

  const getRoundName = (round: string) => {
    const roundNames: { [key: string]: string } = {
      '1R': '1回戦',
      '2R': '2回戦',
      '3R': '3回戦',
      '4R': '4回戦',
      'QF': '準々決勝',
      'SF': '準決勝',
      'F': '決勝',
    };
    return roundNames[round] || round;
  };

  const getPlayerDisplay = (
    player?: { name: string; registrationNo: string },
    seed?: number,
    partner?: string
  ) => {
    if (!player) return 'BYE';
    
    let display = player.name;
    if (partner) {
      display += ` / ${partner}`;
    }
    if (seed) {
      display = `[${seed}] ${display}`;
    }
    return display;
  };

  const groupMatchesByRound = () => {
    if (!category) return {};
    
    const grouped: { [round: string]: MatchDetail[] } = {};
    category.matches.forEach(match => {
      if (!grouped[match.round]) {
        grouped[match.round] = [];
      }
      grouped[match.round].push(match);
    });
    
    // ラウンド順にソート
    const sortedGrouped: { [round: string]: MatchDetail[] } = {};
    ROUND_ORDER.forEach(round => {
      if (grouped[round]) {
        sortedGrouped[round] = grouped[round].sort((a, b) => 
          (a.matchNumber || 0) - (b.matchNumber || 0)
        );
      }
    });
    
    return sortedGrouped;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">データが見つかりません</p>
        </div>
      </div>
    );
  }

  const groupedMatches = groupMatchesByRound();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Link
          href={`/admin/tournament/${params.id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          大会詳細に戻る
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {category.tournament.name} ({category.tournament.year}年)
        </h1>
        <h2 className="text-lg text-gray-700 flex items-center">
          <Trophy className="h-5 w-5 mr-2" />
          {getCategoryName()} - 全試合結果
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          {category.drawSize}ドロー・{category.matches.length}試合
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedMatches).map(([round, matches]) => (
          <div key={round} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Swords className="h-5 w-5 mr-2" />
              {getRoundName(round)}
            </h3>
            
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className={`border rounded-lg p-4 ${
                    match.round === 'F' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  {match.matchNumber && (
                    <div className="text-xs text-gray-500 mb-2">
                      第{match.matchNumber}試合
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className={`text-sm ${
                      match.winner === 'player1' ? 'font-semibold' : ''
                    }`}>
                      <div>{getPlayerDisplay(match.player1, match.player1Seed, match.player1Partner)}</div>
                      {match.player1 && (
                        <div className="text-xs text-gray-500">{match.player1.registrationNo}</div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <div className="font-mono text-sm font-medium">
                        {match.score || '-'}
                      </div>
                    </div>
                    
                    <div className={`text-sm text-right ${
                      match.winner === 'player2' ? 'font-semibold' : ''
                    }`}>
                      <div>{getPlayerDisplay(match.player2, match.player2Seed, match.player2Partner)}</div>
                      {match.player2 && (
                        <div className="text-xs text-gray-500">{match.player2.registrationNo}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}