# Nero Party

> **Sharing with others?** Jump to [Sharing the App](#sharing-the-app) below.

A real-time music listening party app. Create a party, invite friends, add songs to a shared queue, listen together, vote with fire reactions, and crown the winning song.

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# 1. Clone and install all dependencies
npm run install:all

# 2. Copy environment file
cp .env.example .env

# 3. Set up the database
cd backend && npx prisma migrate dev --name init && cd ..

# 4. Start both servers
npm run dev
```

This starts:
- **Backend API + Socket.IO** → `http://localhost:3000`
- **Frontend** → `http://localhost:5173`

Open `http://localhost:5173` in your browser to use the app.

## How It Works

1. **Create a Party** — Set a name, your display name, song limit, and duration
2. **Share the Code** — Copy the 6-character code or invite link and send to friends
3. **Add Songs** — Anyone can search and add songs from the Deezer catalog (30-second previews)
4. **Listen Together** — The host controls playback; everyone hears the same track
5. **Vote with Fire** — Tap the 🔥 button on any song to cast your vote (blind voting — standings hidden during the party)
6. **Winner Reveal** — When the party ends, a cinematic reveal shows the winning song ranked by fire votes

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Express.js, Prisma ORM, Socket.IO |
| Frontend | React 18, Vite, TailwindCSS, Motion (Framer Motion) |
| Database | SQLite (no setup required) |
| Music API | Deezer public API (free, no API key needed) |
| Icons | Phosphor Icons |

## Project Structure

```
nero-party/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Party, Participant, QueueItem, Vote models
│   │   └── migrations/
│   └── src/
│       ├── index.ts            # Express + Socket.IO server, all routes & events
│       ├── env.ts
│       └── lib/prisma.ts
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.tsx        # Create party
        │   ├── Join.tsx        # Join via code
        │   ├── Party.tsx       # Main party experience
        │   └── Results.tsx     # Cinematic winner reveal
        └── lib/
            ├── api.ts          # REST client
            ├── socket.ts       # Socket.IO client
            └── types.ts        # Shared TypeScript types
```

## Sharing the App

There are two ways to let others join from outside your machine.

### Option A — Same Wi-Fi (LAN)

Everyone must be on the same network (home/office Wi-Fi).

```bash
# 1. Build the frontend
npm run build

# 2. Find your local IP on Windows
ipconfig
# Look for: IPv4 Address . . . . . . : 192.168.x.x

# 3. Start the backend (it now serves the built frontend too)
npm run start
```

Share `http://192.168.x.x:3000` — anyone on the same network can open it.

---

### Option B — Internet (anywhere in the world) via ngrok

ngrok creates a public HTTPS tunnel to your local server in one command.

```bash
# 1. Build the frontend
npm run build

# 2. Start backend + open ngrok tunnel in one command
npm run share
```

ngrok will print something like:
```
Forwarding  https://abc123.ngrok-free.app → http://localhost:3000
```

Share that `https://abc123.ngrok-free.app` URL with anyone. They can join from their phone, laptop, anywhere.

> **Note:** The free ngrok tier restarts with a new URL each session. Sign up at ngrok.com for a stable URL.

---

### How it works (why this wasn't possible before)

Previously the frontend had `localhost:3000` hardcoded — anyone else's browser would try connecting to *their own* machine. Now:

- **Dev mode** (`npm run dev`): Vite proxies `/api` and `/socket.io` → `localhost:3000`. Works exactly as before.
- **Production** (`npm run build` + `npm run start`): Express serves the built frontend on port 3000. All API and socket calls use relative paths (same origin). Expose that single port with ngrok and the full app — frontend + backend + real-time — flows through the tunnel.

## Design Notes

Built with an **Ethereal Glass** aesthetic — OLED black background, violet accent, frosted glass cards with white hairline borders, and physics-driven animations throughout. Every transition uses custom `cubic-bezier(0.32, 0.72, 0, 1)` easing. No Inter font, no generic shadows, no AI-slop purple gradients.

The voting mechanism is intentionally blind — votes are visible on individual songs but the overall standings are not revealed until the host ends the party, creating genuine suspense around the winner reveal.
