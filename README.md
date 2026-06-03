# Nero Party

A real-time music listening party app. Create a party, invite friends, add songs to a shared queue, listen together, vote with fire reactions, and crown the winning song.

---

## Table of Contents

- [First-Time Setup](#first-time-setup)
- [Running Locally (Solo Test)](#running-locally-solo-test)
- [Running a Real Party (Multiple People)](#running-a-real-party-multiple-people)
- [Full Feature Walkthrough](#full-feature-walkthrough)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)

---

## First-Time Setup

**Prerequisites:** Node.js 18+ and npm.

Run these commands one at a time from inside the `nero-party/` directory:

```bash
# 1. Install root-level dependencies (includes the concurrently dev runner)
npm install

# 2. Install backend dependencies
cd backend
npm install
cd ..

# 3. Install frontend dependencies
#    --legacy-peer-deps is required: @react-three/fiber declares a peer dep on
#    React 19 but this project targets React 18. npm refuses without this flag.
cd frontend
npm install --legacy-peer-deps
cd ..

# 4. Create the environment file
#    Mac/Linux:
cp .env.example .env
#    Windows (PowerShell):
copy .env.example .env

# 5. Set up the SQLite database
cd backend
npx prisma migrate dev --name init
cd ..
```

You only need to do this once. After the first setup, skip straight to the run commands below.

---

## Running Locally (Solo Test)

Use this to explore the app and test all features on your own machine using multiple browser tabs.

```bash
npm run dev
```

> **If you see `EADDRINUSE: address already in use :::3000`**, another process is already using port 3000 (e.g. a previous server session). Kill it first:
> - **Mac/Linux:** `lsof -ti:3000 | xargs kill`
> - **Windows (PowerShell):** `Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }`
>
> Then run `npm run dev` again.

This starts two servers concurrently:
- **Backend** (API + Socket.IO) → `http://localhost:3000`
- **Frontend** (Vite dev server) → `http://localhost:5173`

Open `http://localhost:5173` in your browser.

**Testing with multiple participants on the same machine:**

1. Open `http://localhost:5173` in **Tab 1** → Create a party (you become the host)
2. Copy the 6-character party code shown in the lobby
3. Open `http://localhost:5173` in **Tab 2** (or an Incognito window) → click **Join a Party** → enter the code and a different display name
4. Both tabs are now in the same party in real time — queue changes, votes, and playback sync instantly

---

## Running a Real Party (Multiple People)

To let other people on different devices join, you need to expose your local server. Two options:

### Option A — Same Wi-Fi network

Everyone must be on the same Wi-Fi (home, office, etc.).

```bash
# 1. Build the frontend into static files
npm run build

# 2. Start the production server (serves frontend + backend on one port)
npm run start
```

Then find your local IP address:

```bash
# Windows
ipconfig
# Look for: IPv4 Address . . . 192.168.x.x

# Mac/Linux
ifconfig | grep "inet "
```

Share `http://192.168.x.x:3000` with everyone on the same network. They open it in any browser — no install needed.

---

### Option B — Internet / different networks (ngrok)

Use this when participants are on different Wi-Fi networks, using mobile data, or in different locations.

```bash
# 1. Build the frontend
npm run build

# 2. Start the server AND open a public tunnel simultaneously
npm run share
```

> **Important:** If port 3000 is already in use (e.g. from a previous `npm run dev`), stop it first before running `npm run share`.

ngrok will print a public URL in the terminal:
```
Forwarding  https://abc123.ngrok-free.app → http://localhost:3000
```

Share that URL with anyone. They can join from their phone, laptop, or any device on any network.

> The free ngrok tier gives a new URL each session. Sign up free at [ngrok.com](https://ngrok.com) and run `npx ngrok config add-authtoken YOUR_TOKEN` once to remove connection limits.

---

## Full Feature Walkthrough

This walks through a complete party from start to finish.

### 1. Create a Party (Host)

- Go to the app URL and click **Create a Party**
- Enter a party name and your display name
- Configure optional settings: max songs and session duration
- Click **Launch Party** — you land in the lobby

### 2. Invite Participants

- In the lobby, your **6-character party code** is displayed (e.g. `AB12CD`)
- Click **Copy Link** to copy a direct join URL like `https://your-url/join/AB12CD`
- Share the link or code with your friends

### 3. Add Songs to the Queue (Lobby)

- Click **Add Songs** in the lobby
- Search for any track by name or artist (powered by Deezer — no account needed)
- Click a result to add it to the queue. A green tick appears on songs already added
- Add as many songs as you want before starting — participants can also add songs

### 4. Start the Party (Host Only)

- Once at least one song is in the queue, the **Start the Party** button activates
- Click it — the party goes live for everyone simultaneously

### 5. During the Party

**Everyone:**
- Sees the currently playing song with album art, a progress bar, and a waveform animation
- Can tap the album art to expand it full-screen (Spotify-style backdrop reveal)
- Can 🔥 **fire vote** on the current song — votes are hidden from the leaderboard until the end
- Can add more songs to the queue via **Add Song**

**Host only:**
- Controls playback: Play/Pause and scrub the progress bar
- Clicks a song in the queue to skip to it immediately
- Drags songs in the queue to reorder them
- Clicks ⋮ on a queue item for **Play Now** or **Move to Top**
- Clicks **Next Song** to advance manually
- Clicks **End Party** to trigger the winner reveal at any time

**Played songs (bottom of queue panel):**
- Shows all songs that have already been played
- **Guests** can tap a played song to request a replay — the host sees a replay count (↺)
- **Host** sees two stats per played song: 🔥 competition votes + ↺ replay requests

### 6. Winner Reveal

When the host clicks **End Party** (or the last song finishes):
- All participants are taken to the **Results screen** simultaneously
- Confetti bursts across the screen
- The winning song (most 🔥 fire votes) rises with a gold crown
- The full leaderboard animates in ranked by vote count
- Click **Throw Another Party** to start again

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Express.js, Prisma ORM, Socket.IO |
| Frontend | React 18, Vite, TailwindCSS, Motion (Framer Motion) |
| Database | SQLite — no external database needed |
| Music API | Deezer public API — free, no API key required |
| Icons | Phosphor Icons |
| Animations | motion/react (Framer Motion) |

---

## Project Structure

```
nero-party/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Party, Participant, QueueItem, Vote, ReplayRequest
│   │   └── migrations/
│   └── src/
│       ├── index.ts             # All Express routes + Socket.IO event handlers
│       ├── env.ts
│       └── lib/prisma.ts
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.tsx         # Create party
        │   ├── Join.tsx         # Join via code
        │   ├── Party.tsx        # Main party experience (lobby + active + queue)
        │   └── Results.tsx      # Cinematic winner reveal + confetti
        └── lib/
            ├── api.ts           # REST API client
            ├── socket.ts        # Socket.IO client
            └── types.ts         # Shared TypeScript interfaces
```

---

## Scripts Reference

| Command | What it does |
|---|---|
| `npm run install:all` | Install all backend + frontend dependencies |
| `npm run dev` | Start both servers for local development |
| `npm run build` | Build the frontend into `frontend/dist/` |
| `npm run start` | Start backend (serves built frontend on port 3000) |
| `npm run share` | Build + start + open ngrok tunnel for public sharing |

---

## Design

Built with a **Tangerine Orange + Ethereal Glass** aesthetic — OLED black `#050505` background, `#FF9700` orange accent, frosted glass cards with hairline borders, and physics-driven animations throughout (`cubic-bezier(0.32, 0.72, 0, 1)` easing on everything). Fonts: Plus Jakarta Sans. Icons: Phosphor (light weight).

Voting is intentionally blind — individual song vote counts are visible while the party is live, but the overall leaderboard ranking is hidden until the host ends the session, creating genuine suspense around the winner reveal.
