import Link from 'next/link';
import { Database, Trophy, ArrowLeft } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          ホームに戻る
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">管理画面</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/admin/scraping" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Database className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">スクレイピング管理</h2>
            </div>
            <p className="text-gray-600">
              JTAサイトから最新のランキングデータを取得・管理します。
              アーカイブデータの取得やバッチ処理が可能です。
            </p>
          </div>
        </Link>
        
        <Link href="/admin/tournament" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Trophy className="h-8 w-8 text-green-500 mr-3" />
              <h2 className="text-xl font-semibold">大会結果管理</h2>
            </div>
            <p className="text-gray-600">
              トーナメント結果のPDFをアップロードして、試合結果を自動抽出・管理します。
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}