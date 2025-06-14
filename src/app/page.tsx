import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  // 統計情報を取得
  const [totalPlayers, totalRankings, latestRanking] = await Promise.all([
    prisma.player.count(),
    prisma.ranking.count(),
    prisma.ranking.findFirst({
      orderBy: { rankingDate: 'desc' },
    }),
  ]);

  const stats = [
    {
      label: '登録選手数',
      value: totalPlayers.toLocaleString(),
      unit: '名',
    },
    {
      label: 'ランキングデータ',
      value: totalRankings.toLocaleString(),
      unit: '件',
    },
    {
      label: '最新データ',
      value: latestRanking ? new Date(latestRanking.rankingDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }) : '-',
      unit: '',
    },
  ];

  const features = [
    {
      title: 'ランキング一覧',
      description: '各カテゴリのランキングを検索・閲覧',
      link: '/rankings',
      icon: '📊',
    },
    {
      title: '管理画面',
      description: 'データの取得・更新を管理',
      link: '/admin/scraping',
      icon: '⚙️',
    },
    {
      title: '選手分析',
      description: 'ランキング推移やカテゴリ遷移を分析',
      link: '#',
      icon: '📈',
      disabled: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* ヒーローセクション */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          JTAテニスランキングシステム
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          日本テニス協会のベテランランキングデータを自動取得・管理・分析するシステム
        </p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 text-center"
          >
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {stat.value}
              <span className="text-lg text-gray-600 ml-1">{stat.unit}</span>
            </p>
            <p className="text-gray-700 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 機能カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => (
          <Link
            key={index}
            href={feature.disabled ? '#' : feature.link}
            className={`block bg-white rounded-lg shadow-md p-6 transition-all duration-200 ${
              feature.disabled
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {feature.title}
              {feature.disabled && (
                <span className="ml-2 text-sm text-gray-500">(開発中)</span>
              )}
            </h3>
            <p className="text-gray-600">{feature.description}</p>
          </Link>
        ))}
      </div>

      {/* 概要 */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">システム概要</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-semibold text-lg mb-2">対象カテゴリ</h3>
            <p>
              男女 × シングルス/ダブルス × 11年齢区分（35歳〜85歳以上）の全44カテゴリ
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">データ範囲</h3>
            <p>2004年1月から現在までの全ランキングデータ</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">主な機能</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>JTAサイトからの自動データ取得</li>
              <li>年齢カテゴリ遷移の追跡</li>
              <li>ランキング推移の可視化（開発中）</li>
              <li>複数カテゴリでの成績比較（開発中）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}