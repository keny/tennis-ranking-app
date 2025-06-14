'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface RankingsFilterProps {
  categories: {
    gender: Record<string, string>;
    type: Record<string, string>;
    ageGroup: Record<string, string>;
  };
  availablePeriods: Array<{
    year: number;
    month: number;
    label: string;
  }>;
  currentFilters: {
    gender: string;
    type: string;
    ageGroup: string;
    year: string;
    month: string;
    limit?: string;
  };
}

export default function RankingsFilter({
  categories,
  availablePeriods,
  currentFilters,
}: RankingsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams();
      
      // 現在のフィルターを保持
      Object.entries(currentFilters).forEach(([k, v]) => {
        if (k !== key) {
          params.set(k, v);
        }
      });
      
      // 新しい値を設定
      params.set(key, value);
      
      // ページ番号をリセット
      params.delete('page');
      
      router.push(`${pathname}?${params.toString()}`);
    },
    [currentFilters, pathname, router]
  );

  const handlePeriodChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const [year, month] = e.target.value.split('-');
      const params = new URLSearchParams();
      
      // 現在のフィルターを保持
      Object.entries(currentFilters).forEach(([k, v]) => {
        if (k !== 'year' && k !== 'month') {
          params.set(k, v);
        }
      });
      
      params.set('year', year);
      params.set('month', month);
      params.delete('page');
      
      router.push(`${pathname}?${params.toString()}`);
    },
    [currentFilters, pathname, router]
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 年月選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            年月
          </label>
          <select
            value={`${currentFilters.year}-${currentFilters.month}`}
            onChange={handlePeriodChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availablePeriods.map((period) => (
              <option
                key={`${period.year}-${period.month}`}
                value={`${period.year}-${period.month}`}
              >
                {period.label}
              </option>
            ))}
          </select>
        </div>

        {/* 性別選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            性別
          </label>
          <select
            value={currentFilters.gender}
            onChange={(e) => updateFilter('gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(categories.gender).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 種目選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            種目
          </label>
          <select
            value={currentFilters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(categories.type).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 年齢カテゴリ選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            年齢カテゴリ
          </label>
          <select
            value={currentFilters.ageGroup}
            onChange={(e) => updateFilter('ageGroup', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(categories.ageGroup).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 表示件数 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            表示件数
          </label>
          <select
            value={currentFilters.limit || '100'}
            onChange={(e) => updateFilter('limit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="100">100件</option>
            <option value="200">200件</option>
            <option value="300">300件</option>
            <option value="500">500件</option>
            <option value="all">全て表示</option>
          </select>
        </div>
      </div>
    </div>
  );
}