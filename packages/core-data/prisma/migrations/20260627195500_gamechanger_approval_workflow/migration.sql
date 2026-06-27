-- GameChanger integration + approval-gated schedule push workflow

ALTER TABLE "TeamSeason"
  ADD COLUMN IF NOT EXISTS "gcTeamId" TEXT,
  ADD COLUMN IF NOT EXISTS "gcTeamIdMappedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "coach_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "coach_practice_version" TEXT;

ALTER TABLE "Player"
  ADD COLUMN IF NOT EXISTS "gcPlayerId" TEXT,
  ADD COLUMN IF NOT EXISTS "gcPlayerIdMappedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Player_gcPlayerId_key') THEN
    CREATE UNIQUE INDEX "Player_gcPlayerId_key" ON "Player"("gcPlayerId");
  END IF;
END $$;

ALTER TABLE "GameChangerStatSnapshot"
  ADD COLUMN IF NOT EXISTS "scheduleGameId" TEXT,
  ADD COLUMN IF NOT EXISTS "gcTeamId" TEXT,
  ADD COLUMN IF NOT EXISTS "gcGameId" TEXT,
  ADD COLUMN IF NOT EXISTS "gcPlayerId" TEXT,
  ADD COLUMN IF NOT EXISTS "result" TEXT,
  ADD COLUMN IF NOT EXISTS "score" TEXT,
  ADD COLUMN IF NOT EXISTS "sourcePayload" JSONB,
  ADD COLUMN IF NOT EXISTS "isReadOnly" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TYPE IF NOT EXISTS "ScheduleGameStatus" AS ENUM (
  'ncs_detected',
  'draft_created',
  'pending_coach_approval',
  'approved',
  'pushed_to_gamechanger',
  'rejected'
);

CREATE TABLE IF NOT EXISTS "ScheduleGame" (
  "id" TEXT PRIMARY KEY,
  "teamSeasonId" TEXT NOT NULL,
  "ncsTournamentEntryId" TEXT,
  "sourceFingerprint" TEXT,
  "status" "ScheduleGameStatus" NOT NULL DEFAULT 'ncs_detected',
  "opponent" TEXT NOT NULL,
  "gameDate" TIMESTAMP(3) NOT NULL,
  "gameTime" TEXT,
  "field" TEXT,
  "location" TEXT,
  "game_type" TEXT,
  "sourcePayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduleGame_teamSeasonId_fkey" FOREIGN KEY ("teamSeasonId") REFERENCES "TeamSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ScheduleGame_ncsTournamentEntryId_fkey" FOREIGN KEY ("ncsTournamentEntryId") REFERENCES "NcsTournamentEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ScheduleGame_sourceFingerprint_key" ON "ScheduleGame"("sourceFingerprint");
CREATE INDEX IF NOT EXISTS "ScheduleGame_teamSeasonId_status_idx" ON "ScheduleGame"("teamSeasonId", "status");

CREATE TABLE IF NOT EXISTS "SchedulePushRequest" (
  "id" TEXT PRIMARY KEY,
  "teamSeasonId" TEXT NOT NULL,
  "scheduleGameId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "gcGameId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchedulePushRequest_teamSeasonId_fkey" FOREIGN KEY ("teamSeasonId") REFERENCES "TeamSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SchedulePushRequest_scheduleGameId_fkey" FOREIGN KEY ("scheduleGameId") REFERENCES "ScheduleGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SchedulePushRequest_scheduleGameId_key" ON "SchedulePushRequest"("scheduleGameId");
CREATE UNIQUE INDEX IF NOT EXISTS "SchedulePushRequest_idempotencyKey_key" ON "SchedulePushRequest"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "SchedulePushRequest_teamSeasonId_status_idx" ON "SchedulePushRequest"("teamSeasonId", "status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GameChangerStatSnapshot_scheduleGameId_fkey') THEN
    ALTER TABLE "GameChangerStatSnapshot"
      ADD CONSTRAINT "GameChangerStatSnapshot_scheduleGameId_fkey"
      FOREIGN KEY ("scheduleGameId") REFERENCES "ScheduleGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "GameChangerStatSnapshot_teamSeasonId_capturedAt_idx" ON "GameChangerStatSnapshot"("teamSeasonId", "capturedAt");
CREATE INDEX IF NOT EXISTS "GameChangerStatSnapshot_gcGameId_idx" ON "GameChangerStatSnapshot"("gcGameId");
