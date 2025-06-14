# JTA Tennis Ranking Analysis App

JTA（日本テニス協会）のベテランランキングデータを自動取得・管理・分析するWebアプリケーション

## 概要

このシステムは、JTAが公開しているベテランランキングデータを効率的に管理し、選手のランキング推移や年齢カテゴリ遷移を可視化することを目的としています。

### 主な機能

- ✅ 自動データ取得: JTAサイトから最新・過去のランキングデータを自動取得
- ✅ 44カテゴリ対応: 男女×シングルス/ダブルス×11年齢区分の全カテゴリ
- ✅ 履歴管理: 2004年以降の全ランキングデータを蓄積
- ✅ 年齢カテゴリ遷移: 選手の年齢に応じたカテゴリ移行を追跡
- ✅ データ分析: ランキング推移、統計情報の可視化
- ✅ バックグラウンド実行: Web開発と並行してデータ取得可能

## 技術スタック

- **フロントエンド**: Next.js 15, React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL + Prisma ORM
- **ホスティング**: Vercel
- **スクレイピング**: Cheerio
- **グラフ**: Chart.js

## セットアップ

### 必要要件

- Node.js 18+
- PostgreSQL（Supabase推奨）
- npm または yarn

### インストール

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
`.env`ファイルを作成し、以下を設定：
```
DATABASE_URL="postgresql://..."
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

## 使い方

### データ取得

1. `http://localhost:3000/admin/scraping`にアクセス
2. 最新ランキングまたはアーカイブデータを選択して取得

### バックグラウンドでのデータ取得

別ターミナルで以下を実行：
```bash
# 特定期間のデータを取得
npx tsx scripts/run-batch-scraping.ts 2024 1 2024 12
```

### 主な画面

- `/` - ホーム（統計情報）
- `/rankings` - ランキング一覧
- `/players/[id]` - 選手詳細
- `/analysis/category` - カテゴリ分析
- `/admin/scraping` - 管理画面

## 開発

### コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# Prisma Studio
npx prisma studio

# リント
npm run lint
```

### プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # APIルート
│   ├── admin/             # 管理画面
│   └── analysis/          # 分析画面
├── components/            # Reactコンポーネント
├── lib/                   # ユーティリティ
│   └── scraping/         # スクレイピング関連
└── scripts/              # 管理用スクリプト
```

## カテゴリコード

JTAのカテゴリコード形式：
- 男子（Gentlemen）: `g`
- 女子（Ladies）: `l`
- シングルス: `s`
- ダブルス: `d`

例：`gs45` = 男子シングルス45歳以上

## 注意事項

### スクレイピング

- レート制限：各リクエスト間に1秒の待機時間
- バッチサイズ：100件ごとに5秒の休憩
- JTAサイトへの負荷を最小限に

### データの扱い

- 月末日付（28日以降）のランキングは翌月扱い
- 重複データに注意（`skipExisting`オプションを使用）
- 全期間の初回取得には3-4時間かかります

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   - DATABASE_URLが正しく設定されているか確認
   - Prismaクライアントを再生成: `npx prisma generate`

2. **スクレイピングエラー**
   - JTAサイトの構造が変更された可能性
   - `lib/scraping/jta-scraper.ts`のセレクタを確認

3. **重複データ**
   - `scripts/cleanup-player-duplicates.ts`を実行

## 貢献

Issue や Pull Request は歓迎します。大きな変更を行う場合は、事前に Issue で議論してください。

## ライセンス

このプロジェクトは個人利用を目的としています。JTAのデータ利用規約を遵守してください。

## 作者

[@keny](https://github.com/keny)

最終更新: 2025年6月15日