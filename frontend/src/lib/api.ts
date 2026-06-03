// In dev: Vite proxies /api → localhost:3000. In prod: same origin.
const BASE = "";

export async function createParty(data: {
  name: string;
  hostName: string;
  maxSongs: number;
  maxDuration: number;
}) {
  const res = await fetch(`${BASE}/api/parties`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function joinParty(code: string, displayName: string) {
  const res = await fetch(`${BASE}/api/parties/${code}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getParty(code: string) {
  const res = await fetch(`${BASE}/api/parties/${code}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function searchMusic(q: string) {
  const res = await fetch(`${BASE}/api/music/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
