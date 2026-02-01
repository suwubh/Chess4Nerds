-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "blackRatingAfter" INTEGER,
ADD COLUMN     "blackRatingBefore" INTEGER,
ADD COLUMN     "gameDurationSeconds" INTEGER,
ADD COLUMN     "totalMoves" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "whiteRatingAfter" INTEGER,
ADD COLUMN     "whiteRatingBefore" INTEGER;

-- CreateTable
CREATE TABLE "PlayerRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentRating" INTEGER NOT NULL DEFAULT 1200,
    "peakRating" INTEGER NOT NULL DEFAULT 1200,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    "longestWinStreak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRating_userId_key" ON "PlayerRating"("userId");

-- CreateIndex
CREATE INDEX "PlayerRating_currentRating_idx" ON "PlayerRating"("currentRating");

-- CreateIndex
CREATE INDEX "Game_whitePlayerId_idx" ON "Game"("whitePlayerId");

-- CreateIndex
CREATE INDEX "Game_blackPlayerId_idx" ON "Game"("blackPlayerId");

-- CreateIndex
CREATE INDEX "Game_startAt_idx" ON "Game"("startAt");

-- AddForeignKey
ALTER TABLE "PlayerRating" ADD CONSTRAINT "PlayerRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
