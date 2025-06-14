// components/RankingAnalysisSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface RankingAnalysisSectionProps {
  gender: string;
  type: string;
  ageGroup: string;
  startYear: string;
  startMonth: string;
  endYear: string;
  endMonth: string;
  CATEGORIES: {
    gender: Record<string, string>;
    type: Record<string, string>;
    ageGroup: Record<string, string>;
  };
  children?: React.ReactNode;
}

export default function RankingAnalysisSection({
  gender,
  type,
  ageGroup,
  startYear,
  startMonth,
  endYear,
  endMonth,
  CATEGORIES,
  children,
}: RankingAnalysisSectionProps) {
  const searchParams = useSearchParams();
  
  // URLパラメータからopen状態を判定（分析実行ボタンが押されたかどうか）
  const hasAnalysisParams = searchParams.has('gender') || searchParams.has('type') || searchParams.has('ageGroup');
  // 初回アクセス時もデフォルトで開く、またはパラメータがある場合は開く
  const [isOpen, setIsOpen] = useState(true);

  // URLパラメータが変更されたら開く
  useEffect(() => {
    if (hasAnalysisParams) {
      setIsOpen(true);
    }
  }, [hasAnalysisParams]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div
        className="cursor-pointer hover:bg-gray-50 p-3 -m-3 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">ランキング推移分析</h2>
          <span className="text-gray-500">{isOpen ? '▼' : '▶'}</span>
        </div>
      </div>
      
      {isOpen && (
        <div className="mt-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">分析条件</h3>
            
            <form method="get" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* カテゴリ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  性別
                </label>
                <select
                  name="gender"
                  defaultValue={gender}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CATEGORIES.gender).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  種目
                </label>
                <select
                  name="type"
                  defaultValue={type}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CATEGORIES.type).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年齢カテゴリ
                </label>
                <select
                  name="ageGroup"
                  defaultValue={ageGroup}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CATEGORIES.ageGroup).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 期間選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始年月
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="startYear"
                    defaultValue={startYear}
                    min="2004"
                    max={new Date().getFullYear()}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="startMonth"
                    defaultValue={startMonth}
                    min="1"
                    max="12"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了年月
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="endYear"
                    defaultValue={endYear}
                    min="2004"
                    max={new Date().getFullYear()}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="endMonth"
                    defaultValue={endMonth}
                    min="1"
                    max="12"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  分析実行
                </button>
              </div>
            </form>
          </div>

          {/* ランキング推移表示 - childrenとして受け取る */}
          {children}
        </div>
      )}
    </div>
  );
}