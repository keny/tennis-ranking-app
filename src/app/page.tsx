import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            テニスランキング分析アプリ
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            JTAベテランランキングの分析・可視化ツール
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Link 
              href="/rankings"
              className="group bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-3xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ランキング一覧
              </h3>
              <p className="text-gray-600">
                最新のベテランJOPランキングを確認
              </p>
              <div className="mt-4 text-blue-600 group-hover:text-blue-700">
                表示する →
              </div>
            </Link>

            <div className="bg-white rounded-lg shadow-lg p-8 opacity-50">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                推移分析
              </h3>
              <p className="text-gray-600">
                選手ごとのランキング推移グラフ
              </p>
              <div className="mt-4 text-gray-400">
                準備中...
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 opacity-50">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                データ管理
              </h3>
              <p className="text-gray-600">
                ランキングデータの追加・編集
              </p>
              <div className="mt-4 text-gray-400">
                準備中...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}