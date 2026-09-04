-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_goal_id_idx" ON "sessions"("goal_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "learning_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
