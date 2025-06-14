'use client';

import { useEffect, useRef, useState } from 'react';
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

interface RankingData {
  gender: string;
  type: string;
  ageGroup: number;
  categoryCode: string;
  rankings: Array<{
    id: number;
    rankPosition: number;
    totalPoints: number;
    rankingDate: string;
  }>;
}

interface RankingChartProps {
  rankingsByCategory: Record<string, RankingData>;
}

export default function RankingChart({ rankingsByCategory }: RankingChartProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'rank' | 'points'>('rank');

  const genderMap: Record<string, string> = { male: '男子', female: '女子' };
  const typeMap: Record<string, string> = { singles: 'シングルス', doubles: 'ダブルス' };

  // 初期表示では最新のカテゴリを選択
  useEffect(() => {
    const categories = Object.keys(rankingsByCategory);
    if (categories.length > 0 && selectedCategories.length === 0) {
      // 最新のランキングがあるカテゴリを選択
      const latestCategory = categories.reduce((latest, current) => {
        const latestDate = new Date(rankingsByCategory[latest].rankings.slice(-1)[0]?.rankingDate || 0);
        const currentDate = new Date(rankingsByCategory[current].rankings.slice(-1)[0]?.rankingDate || 0);
        return currentDate > latestDate ? current : latest;
      });
      setSelectedCategories([latestCategory]);
    }
  }, [rankingsByCategory]);

  // カテゴリ選択の切り替え
  const toggleCategory = (categoryKey: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryKey)) {
        return prev.filter(c => c !== categoryKey);
      }
      return [...prev, categoryKey];
    });
  };

  // グラフデータの生成
  const chartData = {
    labels: [] as string[],
    datasets: [] as any[],
  };

  // 全ての日付ラベルを統合してソート
  const allDates = new Set<string>();
  Object.values(rankingsByCategory).forEach(category => {
    category.rankings.forEach(r => {
      const date = new Date(r.rankingDate);
      allDates.add(`${date.getFullYear()}/${date.getMonth() + 1}`);
    });
  });
  
  const sortedLabels = Array.from(allDates).sort((a, b) => {
    const [aYear, aMonth] = a.split('/').map(Number);
    const [bYear, bMonth] = b.split('/').map(Number);
    return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
  });

  chartData.labels = sortedLabels;
  
  chartData.datasets = selectedCategories.map((categoryKey, index) => {
    const category = rankingsByCategory[categoryKey];
    const categoryName = `${genderMap[category.gender]} ${typeMap[category.type]} ${category.ageGroup}歳以上`;
    
    const colors = [
      'rgb(59, 130, 246)', // blue
      'rgb(239, 68, 68)',  // red
      'rgb(34, 197, 94)',  // green
      'rgb(251, 146, 60)', // orange
      'rgb(168, 85, 247)', // purple
    ];
    
    const color = colors[index % colors.length];
    
    const data = category.rankings.map(r => {
      const date = new Date(r.rankingDate);
      const label = `${date.getFullYear()}/${date.getMonth() + 1}`;
      
      return {
        x: label,
        y: chartType === 'rank' ? r.rankPosition : r.totalPoints,
      };
    });

    return {
      label: categoryName,
      data: data,
      borderColor: color,
      backgroundColor: color,
      tension: 0.1,
    };
  });

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (chartType === 'rank') {
              return `${label}: ${value}位`;
            } else {
              return `${label}: ${value.toLocaleString()}pts`;
            }
          },
        },
      },
    },
    scales: {
      y: {
        reverse: chartType === 'rank',
        beginAtZero: false,
        title: {
          display: true,
          text: chartType === 'rank' ? '順位' : 'ポイント',
        },
      },
      x: {
        title: {
          display: true,
          text: '年月',
        },
      },
    },
  };

  if (Object.keys(rankingsByCategory).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        ランキングデータがありません
      </div>
    );
  }

  return (
    <div>
      {/* 表示切り替えボタン */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('rank')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              chartType === 'rank'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            順位推移
          </button>
          <button
            onClick={() => setChartType('points')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              chartType === 'points'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ポイント推移
          </button>
        </div>
      </div>

      {/* カテゴリ選択 */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">表示するカテゴリを選択：</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(rankingsByCategory).map(([key, category]) => {
            const categoryName = `${genderMap[category.gender]} ${typeMap[category.type]} ${category.ageGroup}歳以上`;
            const isSelected = selectedCategories.includes(key);
            
            return (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {categoryName}
              </button>
            );
          })}
        </div>
      </div>

      {/* グラフ表示 */}
      <div style={{ height: '400px' }}>
        {selectedCategories.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            カテゴリを選択してください
          </div>
        )}
      </div>
    </div>
  );
}