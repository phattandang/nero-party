-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QueueItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "albumArt" TEXT,
    "previewUrl" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "addedBy" TEXT NOT NULL,
    "addedByName" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "played" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "secondsPlayed" INTEGER NOT NULL DEFAULT 0,
    "playedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QueueItem_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QueueItem" ("addedBy", "addedByName", "albumArt", "artist", "createdAt", "duration", "id", "partyId", "played", "playedAt", "position", "previewUrl", "skipped", "title", "trackId") SELECT "addedBy", "addedByName", "albumArt", "artist", "createdAt", "duration", "id", "partyId", "played", "playedAt", "position", "previewUrl", "skipped", "title", "trackId" FROM "QueueItem";
DROP TABLE "QueueItem";
ALTER TABLE "new_QueueItem" RENAME TO "QueueItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
