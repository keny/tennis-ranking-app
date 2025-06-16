# JTA Tennis Ranking Analysis App

JTA（日本テニス協会）のベテランランキングデータを自動取得・管理・分析するWebアプリケーション

## 🎾 概要

このシステムは、JTAが公開しているベテランランキングデータを効率的に管理し、選手のランキング推移や年齢カテゴリ遷移を可視化することを目的としています。

### 主な機能

- ✅ **自動データ取得**: JTAサイトから最新・過去のランキングデータを自動取得
- ✅ **44カテゴリ対応**: 男女×シングルス/ダブルス×11年齢区分の全カテゴリ
- ✅ **履歴管理**: 2004年以降の全ランキングデータを蓄積
- ✅ **年齢カテゴリ遷移**: 選手の年齢に応じたカテゴリ移行を追跡
- 🆕 **トーナメント結果管理**: PDFから試合結果を自動抽出・保存
- 🔄 **データ分析**: ランキング推移、統計情報の可視化（開発中）

## 🚀 セットアップ

### 必要な環境

- Node.js 18+
- PostgreSQL（Supabase推奨）
- npm または yarn

### インストール手順

1. リポジトリのクローン
```bash
git clone https://github.com/keny/tennis-ranking-app.git
cd tennis-ranking-app
```

2. 依存関係のインストール
```bash
npm install
```

3. 環境変数の設定
`.env.local`ファイルを作成し、以下を設定：
```env
DATABASE_URL="postgresql://..."
ANTHROPIC_API_KEY="sk-ant-..."  # トーナメント機能で使用
```

4. データベースのセットアップ
```bash
npx prisma generate
npx prisma db push
```

5. 開発サーバーの起動
```bash
npm run dev
```

## 📊 使い方

### ランキングデータの取得

`http://localhost:3000/admin/scraping`にアクセスして：
- **最新ランキング取得**: JTAサイトの最新データを取得
- **アーカイブ取得**: 過去の特定期間のデータを取得
- **バッチ処理**: 年単位でまとめてデータ取得

### トーナメント結果の登録

1. `http://localhost:3000/admin/tournament`にアクセス
2. PDFファイルをアップロード
3. 自動的に解析されてデータベースに保存
4. `/admin/tournament/[id]`で結果を確認

## 🛠️ 管理スクリプト

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

## 📁 プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── admin/
│   │   ├── scraping/      # ランキング管理画面
│   │   └── tournament/    # トーナメント管理画面
│   └── api/
│       └── admin/
│           ├── scraping/  # スクレイピングAPI
│           └── tournament/ # トーナメントAPI
├── components/
│   ├── BatchScrapingPanel.tsx    # バッチ処理UI
│   ├── TournamentBracket.tsx     # トーナメント表表示
│   └── TournamentStatistics.tsx  # 統計ダッシュボード
└── lib/
    ├── prisma.ts          # Prismaクライアント
    ├── scraping/          # スクレイピング関連
    └── tournament/        # トーナメント関連
        └── tournament-extractor.ts  # PDF解析エンジン

scripts/                   # 管理用スクリプト
├── cleanup-player-duplicates.ts
├── delete-month-data.ts
└── update-archive-periods.ts
```

## 🔧 技術スタック

- **フロントエンド**: Next.js 15, React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL + Prisma ORM
- **AI/ML**: Anthropic Claude API (PDF解析)
- **ホスティング**: Vercel
- **スクレイピング**: Cheerio

## 📝 データ仕様

### ランキングデータ
- 月末日付（28日以降）のランキングは翌月のランキングとして扱われます
- 例：2025年4月30日付 → 2025年5月のランキング

### カテゴリ移行ルール
- 選手は実年齢以下の全カテゴリに参加可能
- メインカテゴリは5歳刻みで自動判定
- カテゴリ移行時は前年度ポイントが引き継がれる

### トーナメントデータ
- JTA公式PDFから自動抽出
- 試合結果、スコア、最終順位を保存
- ダブルスのパートナー情報も管理

## 🚧 開発予定

- [ ] ランキング一覧表示（`/rankings`）
- [ ] 選手個別ページ
- [ ] ランキング推移グラフ（Chart.js）
- [ ] 検索・フィルター機能
- [ ] カテゴリ間比較機能
- [ ] 自動更新機能（Vercel Cron）
- [x] トーナメント結果管理
- [ ] 対戦成績分析

## ⚠️ 注意事項

### API利用制限
- **スクレイピング**: 各リクエスト間に1秒の待機時間
- **バッチ処理**: 100件ごとに5秒の休憩
- **Claude API**: レート制限に注意
- JTAサイトへの負荷を最小限に

### データ取得時の注意
- 重複データに注意（`skipExisting`オプションを使用）
- 全期間の初回取得には3-4時間かかります
- PDFサイズ制限あり（大きすぎるファイルは処理不可）

## 🤝 貢献

Issue や Pull Request は歓迎します。大きな変更を行う場合は、事前に Issue で議論してください。

## 📄 ライセンス

このプロジェクトは個人利用を目的としています。JTAのデータ利用規約を遵守してください。

## 👤 開発者

- [@keny](https://github.com/keny)

最終更新: 2025年1月