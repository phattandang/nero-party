import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { env } from "./env.js";
import { prisma } from "./lib/prisma.js";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// Resolve frontend/dist relative to this file's location (backend/src → ../../frontend/dist)
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
app.use(express.static(frontendDist));

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const AVATAR_COLORS = [
  "#7c3aed", "#db2777", "#ea580c", "#16a34a",
  "#0284c7", "#dc2626", "#9333ea", "#0891b2",
];

function randomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

async function getPartyState(partyId: string) {
  const party = await prisma.party.findUnique({
    where: { id: partyId },
    include: {
      participants: { orderBy: { joinedAt: "asc" } },
      queue: {
        orderBy: { position: "asc" },
        include: { votes: true, replayRequests: true },
      },
    },
  });
  return party;
}

// ─── REST Routes ────────────────────────────────────────────────────────────

// Create party
app.post("/api/parties", async (req, res) => {
  const { name, hostName, maxSongs, maxDuration } = req.body;
  if (!name || !hostName) {
    return res.status(400).json({ error: "name and hostName required" });
  }

  let code = generateCode();
  while (await prisma.party.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const party = await prisma.party.create({
    data: {
      code,
      name,
      hostId: "",
      maxSongs: maxSongs || 20,
      maxDuration: maxDuration || 60,
    },
  });

  const host = await prisma.participant.create({
    data: {
      partyId: party.id,
      displayName: hostName,
      avatarColor: randomColor(),
      isHost: true,
    },
  });

  await prisma.party.update({
    where: { id: party.id },
    data: { hostId: host.id },
  });

  res.json({ party: { ...party, hostId: host.id }, participant: host });
});

// Join party
app.post("/api/parties/:code/join", async (req, res) => {
  const { displayName } = req.body;
  const { code } = req.params;

  if (!displayName) return res.status(400).json({ error: "displayName required" });

  const party = await prisma.party.findUnique({ where: { code: code.toUpperCase() } });
  if (!party) return res.status(404).json({ error: "Party not found" });
  if (party.status === "ended") return res.status(400).json({ error: "Party has ended" });

  const participant = await prisma.participant.create({
    data: {
      partyId: party.id,
      displayName,
      avatarColor: randomColor(),
      isHost: false,
    },
  });

  res.json({ party, participant });
});

// Get party by code
app.get("/api/parties/:code", async (req, res) => {
  const party = await prisma.party.findUnique({
    where: { code: req.params.code.toUpperCase() },
    include: {
      participants: { orderBy: { joinedAt: "asc" } },
      queue: {
        orderBy: { position: "asc" },
        include: { votes: true },
      },
    },
  });
  if (!party) return res.status(404).json({ error: "Party not found" });
  res.json(party);
});

// Deezer search proxy
app.get("/api/music/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "query required" });

  try {
    const response = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(q as string)}&limit=10`
    );
    const data = await response.json() as any;
    const tracks = (data.data || []).map((t: any) => ({
      id: String(t.id),
      title: t.title,
      artist: t.artist.name,
      albumArt: t.album.cover_medium,
      previewUrl: t.preview,
      duration: t.duration,
    }));
    res.json(tracks);
  } catch (e) {
    res.status(500).json({ error: "Music search failed" });
  }
});

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ─── Socket.IO ──────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join a party room
  socket.on("party:join", async ({ partyId, participantId }) => {
    if (!partyId) return;
    socket.join(partyId);
    try {
      await prisma.participant.update({
        where: { id: participantId },
        data: { socketId: socket.id },
      });
    } catch { /* stale participantId — still send state */ }
    const state = await getPartyState(partyId);
    if (!state) return;
    io.to(partyId).emit("party:state", state);
  });

  // Start the party (host only)
  socket.on("party:start", async ({ partyId, participantId }) => {
    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party || party.hostId !== participantId) return;

    const firstSong = await prisma.queueItem.findFirst({
      where: { partyId, played: false },
      orderBy: { position: "asc" },
    });

    await prisma.party.update({
      where: { id: partyId },
      data: { status: "active" },
    });

    if (firstSong) {
      await prisma.queueItem.update({
        where: { id: firstSong.id },
        data: { played: true, playedAt: new Date() },
      });
    }

    const state = await getPartyState(partyId);
    io.to(partyId).emit("party:state", state);
    if (firstSong) io.to(partyId).emit("song:play", firstSong);
  });

  // Add song to queue
  socket.on("queue:add", async ({ partyId, participantId, track }) => {
    const party = await prisma.party.findUnique({
      where: { id: partyId },
      include: { queue: true },
    });
    if (!party || party.status === "ended") return;

    const participant = await prisma.participant.findUnique({ where: { id: participantId } });
    if (!participant) return;

    const maxPos = party.queue.length > 0
      ? Math.max(...party.queue.map((q) => q.position))
      : -1;

    const item = await prisma.queueItem.create({
      data: {
        partyId,
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        albumArt: track.albumArt || "",
        previewUrl: track.previewUrl || "",
        duration: track.duration || 30,
        addedBy: participantId,
        addedByName: participant.displayName,
        position: maxPos + 1,
      },
    });

    const state = await getPartyState(partyId);
    io.to(partyId).emit("party:state", state);
    io.to(partyId).emit("queue:added", item);
  });

  // Next song (host only)
  socket.on("song:next", async ({ partyId, participantId }) => {
    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party || party.hostId !== participantId) return;

    const nextSong = await prisma.queueItem.findFirst({
      where: { partyId, played: false },
      orderBy: { position: "asc" },
    });

    if (!nextSong) {
      // No more songs — end party
      await prisma.party.update({ where: { id: partyId }, data: { status: "ended" } });
      const state = await getPartyState(partyId);
      io.to(partyId).emit("party:state", state);
      io.to(partyId).emit("party:ended", await buildResults(partyId));
      return;
    }

    await prisma.queueItem.update({
      where: { id: nextSong.id },
      data: { played: true, playedAt: new Date() },
    });

    const state = await getPartyState(partyId);
    io.to(partyId).emit("party:state", state);
    io.to(partyId).emit("song:play", nextSong);
  });

  // Cast a vote (fire reaction)
  socket.on("vote:cast", async ({ partyId, participantId, queueItemId }) => {
    try {
      await prisma.vote.create({
        data: { queueItemId, participantId },
      });
    } catch {
      // Already voted — remove vote (toggle)
      await prisma.vote.deleteMany({
        where: { queueItemId, participantId },
      });
    }

    const state = await getPartyState(partyId);
    io.to(partyId).emit("party:state", state);
  });

  // Toggle replay request on a played song (non-host participants only)
  socket.on("replay:toggle", async ({ partyId, participantId, queueItemId }: { partyId: string; participantId: string; queueItemId: string }) => {
    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party || party.hostId === participantId) return; // host excluded

    try {
      await prisma.replayRequest.create({ data: { queueItemId, participantId } });
    } catch {
      await prisma.replayRequest.deleteMany({ where: { queueItemId, participantId } });
    }

    const state = await getPartyState(partyId);
    if (!state) return;
    io.to(partyId).emit("party:state", state);
  });

  // Replay any already-played song — host only, broadcasts to entire room
  socket.on("song:replay", async ({ partyId, participantId, queueItemId }: { partyId: string; participantId: string; queueItemId: string }) => {
    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party || party.hostId !== participantId) return;
    const item = await prisma.queueItem.findUnique({ where: { id: queueItemId } });
    if (!item || item.partyId !== partyId) return;
    io.to(partyId).emit("song:play", item);
  });

  // Host playback control (pause / resume / seek) — broadcasts to everyone except sender
  socket.on("playback:control", ({ partyId, participantId, action, time }: { partyId: string; participantId: string; action: string; time?: number }) => {
    // Fire-and-forget: verify host asynchronously but don't await (low latency matters here)
    prisma.party.findUnique({ where: { id: partyId } }).then((party) => {
      if (!party || party.hostId !== participantId) return;
      socket.broadcast.to(partyId).emit("playback:control", { action, time });
    });
  });

  // Skip directly to a specific song (host only)
  socket.on("song:skip-to", async ({ partyId, participantId, queueItemId }: { partyId: string; participantId: string; queueItemId: string }) => {
    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party || party.hostId !== participantId) return;

    // Mark everything up to and including this item as played
    const target = await prisma.queueItem.findUnique({ where: { id: queueItemId } });
    if (!target || target.played) return;

    await prisma.queueItem.updateMany({
      where: { partyId, played: false, position: { lte: target.position } },
      data: { played: true, playedAt: new Date() },
    });

    const state = await getPartyState(partyId);
    if (!state) return;
    io.to(partyId).emit("party:state", state);
    io.to(partyId).emit("song:play", target);
  });

  // Reorder queue (host only) — accepts full ordered array of unplayed item IDs
  socket.on("queue:reorder", async ({ partyId, participantId, orderedIds }: { partyId: string; participantId: string; orderedIds: string[] }) => {
    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party || party.hostId !== participantId) return;

    // Get current max played position so we don't collide with played items
    const playedMax = await prisma.queueItem.aggregate({
      where: { partyId, played: true },
      _max: { position: true },
    });
    const offset = (playedMax._max.position ?? -1) + 1;

    await prisma.$transaction(
      orderedIds.map((id, idx) =>
        prisma.queueItem.update({
          where: { id },
          data: { position: offset + idx },
        })
      )
    );

    const state = await getPartyState(partyId);
    if (!state) return;
    io.to(partyId).emit("party:state", state);
  });

  // End party (host only)
  socket.on("party:end", async ({ partyId, participantId }) => {
    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party || party.hostId !== participantId) return;

    await prisma.party.update({ where: { id: partyId }, data: { status: "ended" } });
    const results = await buildResults(partyId);
    const state = await getPartyState(partyId);
    io.to(partyId).emit("party:state", state);
    io.to(partyId).emit("party:ended", results);
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    await prisma.participant.updateMany({
      where: { socketId: socket.id },
      data: { socketId: null },
    });
  });
});

async function buildResults(partyId: string) {
  const queue = await prisma.queueItem.findMany({
    where: { partyId },
    include: { votes: true, replayRequests: true },
    orderBy: { position: "asc" },
  });

  const ranked = queue
    .map((item) => ({ ...item, voteCount: item.votes.length }))
    .sort((a, b) => b.voteCount - a.voteCount || a.position - b.position);

  return ranked;
}

// Catch-all: serve React app for any non-API route
app.get("*", (_req, res) => {
  const indexPath = path.join(frontendDist, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send("Frontend not built. Run: npm run build");
  });
});

server.listen(env.PORT, () => {
  console.log(`🎵 Nero Party server running on http://localhost:${env.PORT}`);
});
