-- AlterTable
ALTER TABLE "CardioSession" ADD COLUMN IF NOT EXISTS "workoutId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CardioSession_workoutId_idx" ON "CardioSession"("workoutId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CardioSession_workoutId_fkey'
  ) THEN
    ALTER TABLE "CardioSession"
      ADD CONSTRAINT "CardioSession_workoutId_fkey"
      FOREIGN KEY ("workoutId") REFERENCES "Workout"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
