-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "registration_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "club" TEXT,
    "prefecture" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "rank_position" INTEGER NOT NULL,
    "total_points" INTEGER NOT NULL,
    "calc_points" INTEGER NOT NULL,
    "ranking_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_registration_no_key" ON "players"("registration_no");

-- CreateIndex
CREATE INDEX "rankings_category_ranking_date_idx" ON "rankings"("category", "ranking_date");

-- CreateIndex
CREATE INDEX "rankings_player_id_idx" ON "rankings"("player_id");

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
