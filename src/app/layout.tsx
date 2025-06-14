import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JTAテニスランキングシステム',
  description: 'JTAベテランランキングの管理・分析システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <nav className="bg-blue-600 text-white shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link
                  href="/"
                  className="text-xl font-bold hover:text-blue-200 transition-colors"
                >
                  JTAランキング
                </Link>
                <div className="hidden md:flex space-x-6">
                  <Link
                    href="/rankings"
                    className="hover:text-blue-200 transition-colors"
                  >
                    ランキング一覧
                  </Link>
                  <Link
                    href="/analysis/category"
                    className="hover:text-blue-200 transition-colors"
                  >
                    カテゴリ分析
                  </Link>
                  <Link
                    href="/admin/scraping"
                    className="hover:text-blue-200 transition-colors"
                  >
                    管理画面
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-grow bg-gray-50">{children}</main>
        <Footer />
      </body>
    </html>
  );
}