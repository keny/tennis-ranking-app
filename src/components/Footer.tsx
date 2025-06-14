// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* サービス情報 */}
          <div>
            <h3 className="font-semibold text-lg mb-3">JTAテニスランキング分析</h3>
            <p className="text-sm text-gray-600">
              JTA公式ランキングデータを基にした分析・可視化サービス
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ※本サービスはJTAとは無関係の個人サービスです
            </p>
          </div>

          {/* リンク */}
          <div>
            <h3 className="font-semibold text-lg mb-3">リンク</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.jta-tennis.or.jp/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  JTA公式サイト
                </a>
              </li>
              <li>
                <Link href="/rankings" className="text-blue-600 hover:underline">
                  ランキング一覧
                </Link>
              </li>
              <li>
                <Link href="/analysis/category" className="text-blue-600 hover:underline">
                  カテゴリ分析
                </Link>
              </li>
            </ul>
          </div>

          {/* 法的情報 */}
          <div>
            <h3 className="font-semibold text-lg mb-3">法的情報</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-blue-600 hover:underline">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:contact@example.com" 
                  className="text-blue-600 hover:underline"
                >
                  お問い合わせ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center">
          <p className="text-sm text-gray-600">
            データ出典：
            <a 
              href="https://www.jta-tennis.or.jp/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              公益財団法人日本テニス協会
            </a>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            © 2025 JTAテニスランキング分析サービス. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}