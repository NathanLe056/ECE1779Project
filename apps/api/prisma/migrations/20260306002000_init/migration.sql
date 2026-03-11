-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_by" INTEGER NOT NULL,
    "bracket_size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMember" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "ranking" INTEGER,

    CONSTRAINT "TournamentMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "player1_id" INTEGER NOT NULL,
    "player2_id" INTEGER NOT NULL,
    "winner_id" INTEGER,
    "round_number" INTEGER NOT NULL,
    "match_order" INTEGER NOT NULL,
    "match_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMember" ADD CONSTRAINT "TournamentMember_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMember" ADD CONSTRAINT "TournamentMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
