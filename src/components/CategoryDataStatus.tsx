// components/CategoryDataStatus.tsx
'use client';

import { useState } from 'react';

interface CategoryDataCount {
  gender: string;
  type: string;
  ageGroup: number;
  count: number;
}

interface PeriodData {
  year: number;
  month: number;
  total: number;
  categories: CategoryDataCount[];
}

export default function CategoryDataStatus({ periodData }: { periodData: PeriodData | null }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!periodData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">データ取得状況</h2>
        <p className="text-gray-500">データがありません</p>
      </div>
    );
  }

  const genderTypeMap = [
    { gender: 'male', type: 'singles', label: '男S' },
    { gender: 'male', type: 'doubles', label: '男D' },
    { gender: 'female', type: 'singles', label: '女S' },
    { gender: 'female', type: 'doubles', label: '女D' },
  ];

  const ageGroups = [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div
        className="cursor-pointer hover:bg-gray-50 p-3 -m-3 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">期間別・カテゴリ別データ数</h2>
            <span className="text-gray-600">
              {periodData.year}年{periodData.month}月 (合計: {periodData.total.toLocaleString()}件)
            </span>
            {periodData.categories.length < 44 && (
              <span className="text-yellow-600 text-sm">
                ※ {44 - periodData.categories.length}カテゴリ不足
              </span>
            )}
          </div>
          <span className="text-gray-500">{isOpen ? '▼' : '▶'}</span>
        </div>
      </div>
      
      {isOpen && (
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ageGroups.map(ageGroup => {
              return (
                <div key={ageGroup} className="border rounded-lg p-3">
                  <div className="font-medium mb-2">{ageGroup}歳以上</div>
                  <div className="grid grid-cols-4 gap-2">
                    {genderTypeMap.map(({ gender, type, label }) => {
                      const category = periodData.categories.find(
                        c => c.gender === gender && c.type === type && c.ageGroup === ageGroup
                      );
                      return (
                        <div
                          key={`${gender}-${type}`}
                          className={`text-center p-2 rounded ${
                            category 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-lg font-bold">
                            {category ? category.count.toLocaleString() : '✗'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>※ 各カテゴリは全44種類（男女 × シングルス/ダブルス × 11年齢区分）</p>
            <p>※ 緑色：データあり、赤色：データなし</p>
          </div>
        </div>
      )}
    </div>
  );
}