# JTA Tennis Ranking Analysis App

JTA（日本テニス協会）のベテランランキングデータを自動取得・管理・分析するWebアプリケーション

このシステムは、JTAが公開しているベテランランキングデータを効率的に管理し、選手のランキング推移や年齢カテゴリ遷移を可視化することを目的としています。

## 主な機能

- ✅ **自動データ取得**: JTAサイトから最新・過去のランキングデータを自動取得
- ✅ **44カテゴリ対応**: 男女×シングルス/ダブルス×11年齢区分の全カテゴリ
- ✅ **履歴管理**: 2004年以降の全ランキングデータを蓄積
- ✅ **年齢カテゴリ遷移**: 選手の年齢に応じたカテゴリ移行を追跡
- ✅ **ランキング一覧**: 各カテゴリのランキングを検索・閲覧
- ✅ **選手個別分析**: ランキング推移グラフ、カテゴリ別成績表示
- 🔄 **検索・エクスポート**: 選手検索、CSVダウンロード（開発中）

## 技術スタック

- **フロントエンド**: Next.js 15, React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL + Prisma ORM
- **グラフ**: Chart.js + react-chartjs-2
- **ホスティング**: Vercel
- **スクレイピング**: Cheerio

## 必要な環境

- Node.js 18+
- PostgreSQL（Supabase推奨）
- npm または yarn

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/keny/tennis-ranking-app.git
cd tennis-ranking-app
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env`ファイルを作成し、以下を設定：

```env
DATABASE_URL="postgresql://..."
```

### 4. データベースのセットアップ

```bash
npx prisma generate
npx prisma db push
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

## 使い方

### ランキング閲覧

http://localhost:3000/rankings にアクセスして：
- カテゴリ別ランキングの閲覧
- 年月、性別、種目、年齢カテゴリでフィルタリング
- 表示件数の調整（100件〜全件表示）

### 選手個別ページ

ランキング一覧から選手名をクリック、または http://localhost:3000/players/[選手ID] にアクセスして：
- 選手プロフィール（登録番号、所属、都道府県）
- ランキング推移グラフ（順位/ポイント切り替え可能）
- カテゴリ別ランキング履歴
- 複数カテゴリの同時比較

### データ管理（管理画面）

http://localhost:3000/admin/scraping にアクセスして：
- **最新ランキング取得**: JTAサイトの最新データを取得
- **アーカイブ取得**: 過去の特定期間のデータを取得
- **バッチ処理**: 年単位でまとめてデータ取得

## 管理用スクリプト

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

## プロジェクト構造

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # ホームページ
│   ├── layout.tsx                # 共通レイアウト
│   ├── rankings/
│   │   └── page.tsx              # ランキング一覧ページ
│   ├── players/
│   │   └── [id]/
│   │       ├── page.tsx          # 選手個別ページ
│   │       └── not-found.tsx     # 404ページ
│   ├── admin/
│   │   └── scraping/             # 管理画面
│   └── api/
│       └── admin/scraping/       # スクレイピングAPI
├── components/
│   ├── RankingsTable.tsx         # ランキングテーブル
│   ├── RankingsFilter.tsx        # フィルターコンポーネント
│   ├── PlayerInfo.tsx            # 選手プロフィール
│   ├── RankingChart.tsx          # ランキング推移グラフ
│   └── BatchScrapingPanel.tsx    # バッチ処理UI
└── lib/
    ├── prisma.ts                 # Prismaクライアント
    └── scraping/
        ├── archive-utils.ts      # アーカイブ関連ユーティリティ
        ├── jta-scraper.ts        # JTAサイトスクレイパー
        ├── scraping-service.ts   # スクレイピングサービス
        └── batch-client.ts       # バッチ処理クライアント

scripts/                          # 管理用スクリプト
├── cleanup-player-duplicates.ts
├── delete-month-data.ts
└── update-archive-periods.ts
```

## データベーススキーマ

### Player（選手）
- `id`: 一意識別子
- `registrationNo`: JTA登録番号
- `name`: 選手名
- `club`: 所属クラブ
- `prefecture`: 都道府県
- `birthDate`: 生年月日（nullable）

### Ranking（ランキング）
- `id`: 一意識別子
- `playerId`: 選手ID（外部キー）
- `categoryCode`: カテゴリコード（例：ls45）
- `gender`: 性別（male/female）
- `type`: 種目（singles/doubles）
- `ageGroup`: 年齢グループ（35, 40, 45...）
- `rankPosition`: 順位
- `totalPoints`: 総ポイント
- `calcPoints`: 計算ポイント
- `rankingDate`: ランキング日付
- `isTied`: 同率フラグ

## 重要な仕様

### JTAランキングの日付ルール
- **月末日付（28日以降）のランキングは翌月のランキングとして扱われます**
- 例：2025年4月30日付 → 2025年5月のランキング

### 年齢カテゴリルール
- 選手は実年齢以下の全カテゴリに参加可能
- メインカテゴリは5歳刻みで自動判定
- カテゴリ移行時は前年度ポイントが引き継がれる

## パフォーマンスに関する注意

### スクレイピング時の制限
- レート制限：各リクエスト間に1秒の待機時間
- バッチサイズ：100件ごとに5秒の休憩
- JTAサイトへの負荷を最小限に

### データの整合性
- 同じ月を複数回スクレイピングすると重複する可能性
- `skipExisting`オプションを使用推奨
- 全期間の初回取得には3-4時間かかります

## 今後の開発予定

- [ ] 検索機能（選手名、都道府県）
- [ ] データエクスポート機能（CSV）
- [ ] 複数選手の比較機能
- [ ] 高度な統計分析
- [ ] 自動更新機能（Vercel Cron）
- [ ] モバイルアプリ対応

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   - DATABASE_URLが正しく設定されているか確認
   - Prismaクライアントが生成されているか確認（`npx prisma generate`）

2. **スクレイピングエラー**
   - JTAサイトの構造が変更されていないか確認
   - レート制限に引っかかっていないか確認

3. **重複データ**
   - cleanup-player-duplicates.tsスクリプトを実行
   - skipExistingオプションを使用

## 貢献方法

Issue や Pull Request は歓迎します。大きな変更を行う場合は、事前に Issue で議論してください。

## ライセンス

このプロジェクトは個人利用を目的としています。JTAのデータ利用規約を遵守してください。

## 開発者

- [@keny](https://github.com/keny)

## 更新履歴

- 2024年12月: 初版リリース、スクレイピング機能実装
- 2025年6月14日: ランキング一覧ページ実装、UIの大幅改善
- 2025年6月14日: 選手個別ページ実装、グラフ機能追加

最終更新: 2025年6月14日