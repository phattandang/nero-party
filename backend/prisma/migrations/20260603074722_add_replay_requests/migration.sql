-- CreateTable
CREATE TABLE "ReplayRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "queueItemId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReplayRequest_queueItemId_fkey" FOREIGN KEY ("queueItemId") REFERENCES "QueueItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReplayRequest_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ReplayRequest_queueItemId_participantId_key" ON "ReplayRequest"("queueItemId", "participantId");
