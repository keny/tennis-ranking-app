'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Chart.jsの設定
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Player {
  id: number;
  name: string;
  prefecture: string | null;
}

interface Ranking {
  id: number;
  rankPosition: number;
  totalPoints: number;
  player: Player;
}

interface Period {
  year: number;
  month: number;
  rankings: Ranking[];
}

interface CategoryRankingFlowProps {
  periods: Period[];
}

export default function CategoryRankingFlow({ periods }: CategoryRankingFlowProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [hoveredPlayer, setHoveredPlayer] = useState<number | null>(null);
  const [showNewEntries, setShowNewEntries] = useState(true);
  const [showDropouts, setShowDropouts] = useState(true);

  // 全選手のリストを作成
  const allPlayers = useMemo(() => {
    const playerMap = new Map<number, Player>();
    periods.forEach(period => {
      period.rankings.forEach(ranking => {
        if (!playerMap.has(ranking.player.id)) {
          playerMap.set(ranking.player.id, ranking.player);
        }
      });
    });
    return Array.from(playerMap.values());
  }, [periods]);

  // 選手ごとのランキング推移を計算
  const playerRankings = useMemo(() => {
    const result = new Map<number, { periods: string[], ranks: (number | null)[] }>();
    
    const allPeriods = periods.map(p => `${p.year}/${p.month}`);
    
    // 全選手の全期間のデータを初期化
    allPlayers.forEach(player => {
      result.set(player.id, {
        periods: allPeriods,
        ranks: new Array(allPeriods.length).fill(null),
      });
    });
    
    // 実際のランキングデータを設定
    periods.forEach((period, periodIndex) => {
      period.rankings.forEach(ranking => {
        const playerData = result.get(ranking.player.id);
        if (playerData) {
          playerData.ranks[periodIndex] = ranking.rankPosition;
        }
      });
    });
    
    return result;
  }, [periods, allPlayers]);

  // 新規参入と脱落を検出
  const changes = useMemo(() => {
    const newEntries = new Map<number, string[]>(); // playerId -> periods
    const dropouts = new Map<number, string[]>();
    
    playerRankings.forEach((data, playerId) => {
      const entries: string[] = [];
      const exits: string[] = [];
      
      data.ranks.forEach((rank, index) => {
        const prevRank = index > 0 ? data.ranks[index - 1] : null;
        const nextRank = index < data.ranks.length - 1 ? data.ranks[index + 1] : null;
        
        // 新規参入（前回nullで今回順位あり）
        if (prevRank === null && rank !== null) {
          entries.push(data.periods[index]);
        }
        
        // 脱落（今回順位ありで次回null）
        if (rank !== null && nextRank === null && index < data.ranks.length - 1) {
          exits.push(data.periods[index]);
        }
      });
      
      if (entries.length > 0) newEntries.set(playerId, entries);
      if (exits.length > 0) dropouts.set(playerId, exits);
    });
    
    return { newEntries, dropouts };
  }, [playerRankings]);

  const togglePlayer = (playerId: number) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  // ランク帯で選手を選択
  const selectByRankRange = (startRank: number, endRank: number) => {
    const playersInRange = new Set<number>();
    
    // 最新期間のランキングを基準にする
    const latestPeriod = periods[periods.length - 1];
    if (latestPeriod) {
      latestPeriod.rankings.forEach(ranking => {
        if (ranking.rankPosition >= startRank && ranking.rankPosition <= endRank) {
          playersInRange.add(ranking.player.id);
        }
      });
    }
    
    setSelectedPlayers(playersInRange);
  };

  // グラフデータの生成
  const chartData = useMemo(() => {
    const labels = periods.map(p => `${p.year}/${p.month}`);
    
    // カラーパレットを拡張（128名分）
    const generateColor = (index: number, isHovered: boolean) => {
      const hue = (index * 137.5) % 360; // 黄金角を使用して均等に分散
      const saturation = isHovered ? 70 : 50 + (index % 3) * 20; // ホバー時は彩度を上げる
      const lightness = isHovered ? 50 : 40 + (index % 4) * 10; // ホバー時は明度を上げる
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };
    
    const datasets = Array.from(selectedPlayers).map((playerId, index) => {
      const player = allPlayers.find(p => p.id === playerId);
      const data = playerRankings.get(playerId);
      
      if (!player || !data) return null;
      
      const isHovered = hoveredPlayer === playerId;
      const color = generateColor(index, isHovered);
      
      return {
        label: `${player.name} ${player.prefecture ? `(${player.prefecture})` : ''}`,
        data: data.ranks,
        borderColor: color,
        backgroundColor: color,
        tension: 0.1,
        spanGaps: true, // 欠損値をつなぐ
        pointStyle: 'circle',
        pointRadius: isHovered ? 8 : selectedPlayers.size > 20 ? 2 : 5,
        pointHoverRadius: selectedPlayers.size > 20 ? 4 : 7,
        borderWidth: isHovered ? 4 : selectedPlayers.size > 50 ? 1 : 2,
        order: isHovered ? 0 : 1, // ホバーした線を前面に
      };
    }).filter(Boolean);
    
    return { labels, datasets };
  }, [selectedPlayers, allPlayers, playerRankings, periods, hoveredPlayer]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: selectedPlayers.size <= 20, // 20名以下の場合のみ凡例表示
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `ランキング推移（Top128）- ${selectedPlayers.size}名選択中`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const rank = context.parsed.y;
            return rank ? `${context.dataset.label}: ${rank}位` : '';
          },
        },
      },
    },
    scales: {
      y: {
        reverse: true, // 順位なので上が1位
        min: 1,
        max: 128,
        title: {
          display: true,
          text: '順位',
        },
        ticks: {
          stepSize: 10,
        },
      },
      x: {
        title: {
          display: true,
          text: '年月',
        },
      },
    },
    // パフォーマンス最適化
    animation: {
      duration: selectedPlayers.size > 50 ? 0 : 1000, // 50名以上の場合はアニメーション無効
    },
    onHover: (event, activeElements) => {
      if (activeElements.length > 0) {
        const dataIndex = activeElements[0].datasetIndex;
        const playerId = Array.from(selectedPlayers)[dataIndex];
        setHoveredPlayer(playerId);
      } else {
        setHoveredPlayer(null);
      }
    },
  };

  return (
    <div className="space-y-6">
      {/* コントロール */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">表示オプション</h3>
        
        <div className="text-sm text-gray-600 mb-4">
          選手を選択して、ランキング推移を表示してください
        </div>
        {selectedPlayers.size > 20 && (
          <div className="text-sm text-yellow-600 mb-2">
            ※ 多数の選手を選択中のため、凡例は非表示になっています
          </div>
        )}
        {selectedPlayers.size > 50 && (
          <div className="text-sm text-yellow-600 mb-2">
            ※ パフォーマンスのため、アニメーションは無効になっています
          </div>
        )}

        {/* 選手選択 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              選手を選択
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // 全選択
                  const newSelected = new Set(allPlayers.map(p => p.id));
                  setSelectedPlayers(newSelected);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                全選択
              </button>
              <button
                onClick={() => {
                  // 全解除
                  setSelectedPlayers(new Set());
                }}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                全解除
              </button>
            </div>
          </div>
          
          {/* ランク帯選択ボタン */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => selectByRankRange(1, 32)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Top 1-32
            </button>
            <button
              onClick={() => selectByRankRange(33, 64)}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
            >
              Top 33-64
            </button>
            <button
              onClick={() => selectByRankRange(65, 128)}
              className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
            >
              Top 65-128
            </button>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            選択中: {selectedPlayers.size}名 / 全{allPlayers.length}名
          </div>
          <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {allPlayers.map(player => {
                const isSelected = selectedPlayers.has(player.id);
                const newEntryPeriods = changes.newEntries.get(player.id) || [];
                const dropoutPeriods = changes.dropouts.get(player.id) || [];
                
                return (
                  <label
                    key={player.id}
                    className={`
                      flex items-center p-2 rounded cursor-pointer transition-colors
                      ${isSelected 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePlayer(player.id)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {player.name}
                      {player.prefecture && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({player.prefecture})
                        </span>
                      )}
                      {showNewEntries && newEntryPeriods.length > 0 && (
                        <span className="text-xs text-green-600 ml-1">
                          新
                        </span>
                      )}
                      {showDropouts && dropoutPeriods.length > 0 && (
                        <span className="text-xs text-red-600 ml-1">
                          外
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showNewEntries}
              onChange={(e) => setShowNewEntries(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">新規参入を表示</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showDropouts}
              onChange={(e) => setShowDropouts(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">ランク外を表示</span>
          </label>
        </div>
      </div>

      {/* グラフ表示 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div style={{ height: '600px' }}>
          {selectedPlayers.size > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              上記から選手を選択してください
            </div>
          )}
        </div>
      </div>

      {/* 凡例 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-sm font-semibold mb-2">凡例</h3>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>新規ランクイン</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>ランク外へ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>選択中の選手</span>
          </div>
        </div>
      </div>
    </div>
  );
}