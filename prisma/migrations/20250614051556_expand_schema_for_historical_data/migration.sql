/*
  Warnings:

  - You are about to drop the column `category` on the `rankings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[player_id,category_code,ranking_date]` on the table `rankings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `age_group` to the `rankings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_code` to the `rankings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `rankings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `rankings` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "rankings_category_ranking_date_idx";

-- DropIndex
DROP INDEX "rankings_player_id_idx";

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "estimated_birth_year" INTEGER;

-- AlterTable
ALTER TABLE "rankings" DROP COLUMN "category",
ADD COLUMN     "age_group" INTEGER NOT NULL,
ADD COLUMN     "archive_date" TIMESTAMP(3),
ADD COLUMN     "category_code" TEXT NOT NULL,
ADD COLUMN     "gender" TEXT NOT NULL,
ADD COLUMN     "is_latest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scraping_log_id" INTEGER,
ADD COLUMN     "type" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "archive_periods" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "archive_date" TIMESTAMP(3) NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "total_categories" INTEGER NOT NULL DEFAULT 0,
    "processed_categories" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archive_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraping_logs" (
    "id" SERIAL NOT NULL,
    "category_code" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "age_group" INTEGER NOT NULL,
    "ranking_date" TIMESTAMP(3) NOT NULL,
    "archive_period_id" INTEGER,
    "total_records" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "execution_time_ms" INTEGER,
    "data_source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scraping_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_category_history" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "category_code" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "age_group" INTEGER NOT NULL,
    "first_appearance" TIMESTAMP(3) NOT NULL,
    "last_appearance" TIMESTAMP(3) NOT NULL,
    "total_appearances" INTEGER NOT NULL DEFAULT 1,
    "best_rank" INTEGER,
    "best_points" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_category_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "archive_periods_year_month_key" ON "archive_periods"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "player_category_history_player_id_category_code_key" ON "player_category_history"("player_id", "category_code");

-- CreateIndex
CREATE INDEX "rankings_player_id_ranking_date_idx" ON "rankings"("player_id", "ranking_date");

-- CreateIndex
CREATE INDEX "rankings_category_code_ranking_date_idx" ON "rankings"("category_code", "ranking_date");

-- CreateIndex
CREATE INDEX "rankings_is_latest_idx" ON "rankings"("is_latest");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_player_id_category_code_ranking_date_key" ON "rankings"("player_id", "category_code", "ranking_date");

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_scraping_log_id_fkey" FOREIGN KEY ("scraping_log_id") REFERENCES "scraping_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scraping_logs" ADD CONSTRAINT "scraping_logs_archive_period_id_fkey" FOREIGN KEY ("archive_period_id") REFERENCES "archive_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_category_history" ADD CONSTRAINT "player_category_history_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
