# テニスランキングシステム

JTA（日本テニス協会）のベテランランキングデータを自動取得・管理・分析するWebアプリケーション

## 🎾 概要

このシステムは、JTAが公開しているベテランランキングデータを効率的に管理し、選手のランキング推移や年齢カテゴリ遷移を可視化することを目的としています。

### 主な機能

- ✅ **自動データ取得**: JTAサイトから最新・過去のランキングデータを自動取得
- ✅ **44カテゴリ対応**: 男女×シングルス/ダブルス×11年齢区分の全カテゴリ
- ✅ **履歴管理**: 2004年以降の全ランキングデータを蓄積
- ✅ **年齢カテゴリ遷移**: 選手の年齢に応じたカテゴリ移行を追跡
- 🔄 **データ分析**: ランキング推移、統計情報の可視化（開発中）

## 🚀 セットアップ

### 必要な環境

- Node.js 18+
- PostgreSQL（Supabase推奨）
- npm または yarn

### インストール手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/keny/tennis-ranking-app.git
cd tennis-ranking-app
```

2. **依存関係のインストール**
```bash
npm install
```

3. **環境変数の設定**
`.env`ファイルを作成し、以下を設定：
```env
DATABASE_URL="postgresql://..."
```

4. **データベースのセットアップ**
```bash
npx prisma generate
npx prisma db push
```

5. **開発サーバーの起動**
```bash
npm run dev
```

## 📊 データ管理

### スクレイピング管理画面

`http://localhost:3000/admin/scraping` にアクセスして：

- **最新ランキング取得**: JTAサイトの最新データを取得
- **アーカイブ取得**: 過去の特定期間のデータを取得
- **バッチ処理**: 年単位でまとめてデータ取得

### コマンドラインツール

```bash
# 重複データの削除（特定月）
npx tsx scripts/cleanup-player-duplicates.ts 2024 12

# 全重複データの削除
npx tsx scripts/cleanup-player-duplicates.ts all

# アーカイブ期間の更新
npx tsx scripts/update-archive-periods.ts

# 特定月のデータ削除
npx tsx scripts/delete-month-data.ts 2025 6
```

## 🏗️ プロジェクト構造

```
src/
├── app/                          # Next.js App Router
│   ├── admin/
│   │   └── scraping/            # 管理画面
│   └── api/
│       └── admin/scraping/      # スクレイピングAPI
├── components/
│   └── BatchScrapingPanel.tsx   # バッチ処理UI
└── lib/
    ├── prisma.ts                # Prismaクライアント
    └── scraping/
        ├── archive-utils.ts     # アーカイブ関連ユーティリティ
        ├── jta-scraper.ts       # JTAサイトスクレイパー
        ├── scraping-service.ts  # スクレイピングサービス
        └── batch-client.ts      # バッチ処理クライアント

scripts/                         # 管理用スクリプト
├── cleanup-player-duplicates.ts
├── delete-month-data.ts
└── update-archive-periods.ts
```

## 📝 重要な仕様

### JTAランキングの日付ルール

- 月末日付（28日以降）のランキングは**翌月のランキング**として扱われます
- 例：2025年4月30日付 → 2025年5月のランキング

### 年齢カテゴリルール

- 選手は実年齢以下の全カテゴリに参加可能
- メインカテゴリは5歳刻みで自動判定
- カテゴリ移行時は前年度ポイントが引き継がれる

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15, React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL + Prisma ORM
- **ホスティング**: Vercel
- **スクレイピング**: Cheerio

## 📈 今後の開発予定

- [ ] ランキング一覧表示（`/rankings`）
- [ ] 選手個別ページ
- [ ] ランキング推移グラフ（Chart.js）
- [ ] 検索・フィルター機能
- [ ] カテゴリ間比較機能
- [ ] 自動更新機能（Vercel Cron）

## ⚠️ 注意事項

### スクレイピング時の配慮

- レート制限：各リクエスト間に1秒の待機時間
- バッチサイズ：100件ごとに5秒の休憩
- JTAサイトへの負荷を最小限に

### データの取り扱い

- 重複データに注意（`skipExisting`オプションを使用）
- 全期間の初回取得には3-4時間かかります

## 🤝 貢献

Issue や Pull Request は歓迎します。大きな変更を行う場合は、事前に Issue で議論してください。

## 📄 ライセンス

このプロジェクトは個人利用を目的としています。JTAのデータ利用規約を遵守してください。

---

開発者: [@keny](https://github.com/keny)  
最終更新: 2024年12月