import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Pause, SkipForward, MagnifyingGlass, Fire, Users,
  Copy, Check, Crown, MusicNote, Plus, ArrowRight, X, LinkSimple
} from "@phosphor-icons/react";
import { socket } from "../lib/socket";
import { searchMusic } from "../lib/api";
import type { Party, Participant, QueueItem, Track } from "../lib/types";

// ─── Audio Waveform ───────────────────────────────────────────────────────────

function Waveform({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full bg-violet-400 ${playing ? "wave-bar" : ""}`}
          style={{ height: playing ? "100%" : "30%", transition: "height 0.3s", opacity: playing ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
}

// ─── Participant Avatars ──────────────────────────────────────────────────────

function AvatarStack({ participants }: { participants: Participant[] }) {
  const visible = participants.slice(0, 5);
  const extra = participants.length - 5;
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((p) => (
          <div
            key={p.id}
            title={p.displayName}
            className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold"
            style={{ background: p.avatarColor }}
          >
            {p.displayName[0].toUpperCase()}
          </div>
        ))}
        {extra > 0 && (
          <div className="w-7 h-7 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60">
            +{extra}
          </div>
        )}
      </div>
      <span className="text-xs text-white/30 font-medium">
        <Users size={11} className="inline mr-1" />
        {participants.length}
      </span>
    </div>
  );
}

// ─── Now Playing Card ─────────────────────────────────────────────────────────

function NowPlayingCard({
  item, isPlaying, onPlayPause, isHost, myVote, onVote, totalVoters,
}: {
  item: QueueItem | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  isHost: boolean;
  myVote: boolean;
  onVote: () => void;
  totalVoters: number;
}) {
  if (!item) {
    return (
      <div className="rounded-[2rem] border border-white/8 p-1.5 flex-1" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="rounded-[calc(2rem-0.375rem)] flex flex-col items-center justify-center py-20 gap-4" style={{ background: "rgba(8,8,12,0.8)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04)" }}>
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <MusicNote size={28} className="text-white/20" />
          </div>
          <p className="text-white/30 text-sm">No song playing yet</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } }}
      className="rounded-[2rem] border border-white/10 p-1.5 flex-1"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <div
        className="rounded-[calc(2rem-0.375rem)] overflow-hidden relative"
        style={{ background: "rgba(8,8,12,0.9)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)" }}
      >
        {/* Album art blurred background */}
        {item.albumArt && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${item.albumArt})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(40px) saturate(1.5)",
            }}
          />
        )}
        <div className="relative z-10 p-8">
          {/* Now playing label */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Waveform playing={isPlaying} />
              <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium">Now Playing</span>
            </div>
            {item.addedByName && (
              <span className="text-[10px] text-white/25 font-medium">added by {item.addedByName}</span>
            )}
          </div>

          {/* Art + info */}
          <div className="flex gap-6 items-center mb-8">
            {item.albumArt ? (
              <div className="rounded-[1.2rem] border border-white/10 p-1" style={{ background: "rgba(255,255,255,0.05)" }}>
                <img
                  src={item.albumArt}
                  alt={item.title}
                  className="w-24 h-24 rounded-[calc(1.2rem-0.25rem)] object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center">
                <MusicNote size={32} className="text-white/20" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold tracking-tight leading-tight truncate mb-1">{item.title}</h2>
              <p className="text-white/50 text-sm truncate">{item.artist}</p>
            </div>
          </div>

          {/* Vote + controls row */}
          <div className="flex items-center justify-between">
            {/* Vote / fire button */}
            <motion.button
              onClick={onVote}
              whileTap={{ scale: 0.92 }}
              className={`group flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                myVote
                  ? "bg-orange-500/20 border border-orange-500/40 text-orange-400"
                  : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/8 hover:text-white/70"
              }`}
            >
              <Fire
                size={16}
                weight={myVote ? "fill" : "regular"}
                className={myVote ? "text-orange-400" : ""}
              />
              <span>{item.votes.length}</span>
              {totalVoters > 0 && (
                <span className="text-[10px] opacity-50">/ {totalVoters}</span>
              )}
            </motion.button>

            {/* Play controls — host only */}
            {isHost && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onPlayPause}
                  className="w-10 h-10 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/12 transition-all duration-200"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Queue Item Row ───────────────────────────────────────────────────────────

function QueueRow({
  item, index, myVote, onVote, isCurrentlyPlaying,
}: {
  item: QueueItem;
  index: number;
  myVote: boolean;
  onVote: () => void;
  isCurrentlyPlaying: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05, duration: 0.4, ease: [0.32, 0.72, 0, 1] } }}
      className={`group flex items-center gap-3 rounded-2xl border p-3 transition-all duration-200 ${
        isCurrentlyPlaying
          ? "border-violet-500/30 bg-violet-500/8"
          : "border-white/6 bg-white/3 hover:bg-white/5 hover:border-white/10"
      }`}
    >
      {item.albumArt ? (
        <img src={item.albumArt} alt={item.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
          <MusicNote size={16} className="text-white/20" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{item.title}</p>
        <p className="text-xs text-white/40 truncate">{item.artist}</p>
      </div>
      <button
        onClick={onVote}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
          myVote
            ? "bg-orange-500/20 text-orange-400"
            : "bg-white/5 text-white/30 hover:bg-white/8 hover:text-white/50"
        }`}
      >
        <Fire size={12} weight={myVote ? "fill" : "regular"} />
        {item.votes.length}
      </button>
    </motion.div>
  );
}

// ─── Song Search Panel ────────────────────────────────────────────────────────

function SearchPanel({ onAdd, onClose }: { onAdd: (track: Track) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const tracks = await searchMusic(query);
        setResults(tracks);
      } catch { /* ignore */ }
      setLoading(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleAdd(track: Track) {
    onAdd(track);
    setAdded(track.id);
    setTimeout(() => setAdded(null), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } }}
      exit={{ opacity: 0, y: 20, filter: "blur(8px)", transition: { duration: 0.25 } }}
      className="rounded-[2rem] border border-white/10 p-1.5"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <div className="rounded-[calc(2rem-0.375rem)] p-5" style={{ background: "rgba(8,8,12,0.95)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5" style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)" }}>
            <MagnifyingGlass size={14} className="text-white/30 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search for a song..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none"
            />
            {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin flex-shrink-0" />}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/8 transition-all duration-200">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <AnimatePresence>
            {results.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
                className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5 transition-all duration-150 group cursor-pointer"
                onClick={() => handleAdd(track)}
              >
                {track.albumArt ? (
                  <img src={track.albumArt} alt={track.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <MusicNote size={14} className="text-white/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <p className="text-xs text-white/40 truncate">{track.artist}</p>
                </div>
                <div className="flex-shrink-0">
                  {added === track.id ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Plus size={16} className="text-white/20 group-hover:text-violet-400 transition-colors duration-150" />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!loading && query && results.length === 0 && (
            <p className="text-center text-white/25 text-sm py-8">No results found</p>
          )}
          {!query && (
            <p className="text-center text-white/20 text-sm py-8">Start typing to search</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Lobby Screen ─────────────────────────────────────────────────────────────

function LobbyScreen({
  party, isHost, onStart,
}: {
  party: Party;
  isHost: boolean;
  onStart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/join/${party.code}`;

  function copyInvite() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="glow-pulse absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="glow-pulse absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/6 blur-[100px]" style={{ animationDelay: "1.5s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] font-medium text-white/40 mb-4">
            Lobby
          </span>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{party.name}</h1>
          <p className="text-white/40 text-sm">Waiting for everyone to arrive...</p>
        </div>

        {/* Party code card */}
        <div className="rounded-[2rem] border border-white/10 p-1.5 mb-4" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="rounded-[calc(2rem-0.375rem)] p-6" style={{ background: "rgba(8,8,12,0.9)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-3 font-medium">Party Code</p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl font-extrabold tracking-widest font-mono" style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {party.code}
              </span>
              <button
                onClick={copyInvite}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${copied ? "bg-green-500/20 border border-green-500/30 text-green-400" : "bg-white/8 border border-white/10 text-white/60 hover:text-white hover:bg-white/12"}`}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2">
              <LinkSimple size={13} className="text-white/20 flex-shrink-0" />
              <span className="text-xs text-white/25 truncate font-mono">{inviteUrl}</span>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="rounded-[2rem] border border-white/10 p-1.5 mb-4" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="rounded-[calc(2rem-0.375rem)] p-5" style={{ background: "rgba(8,8,12,0.9)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-3 font-medium flex items-center gap-1.5">
              <Users size={11} /> {party.participants.length} in the room
            </p>
            <div className="flex flex-wrap gap-2">
              {party.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 pl-1.5 pr-3 py-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: p.avatarColor }}>
                    {p.displayName[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-white/70 font-medium">{p.displayName}</span>
                  {p.isHost && <Crown size={10} className="text-yellow-400" weight="fill" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {isHost ? (
          <button
            onClick={onStart}
            disabled={party.queue.length === 0}
            className="group w-full flex items-center justify-center gap-3 rounded-full bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-violet-500 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ boxShadow: "0 0 40px rgba(124, 58, 237, 0.4)" }}
          >
            Start the Party
            <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
              <ArrowRight size={12} weight="bold" />
            </span>
          </button>
        ) : (
          <p className="text-center text-white/30 text-sm">Waiting for the host to start the party...</p>
        )}
        {isHost && party.queue.length === 0 && (
          <p className="text-center text-white/25 text-xs mt-2">Add at least one song to start</p>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main Party Page ──────────────────────────────────────────────────────────

export default function Party() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [party, setParty] = useState<Party | null>(null);
  const [participantId] = useState(() => localStorage.getItem("participantId") || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isHost = party?.hostId === participantId;

  const nowPlaying = party?.queue.find((q) => q.played && !party.queue.some((after) => after.position > q.position && after.played)) ?? null;
  const upcomingQueue = party?.queue.filter((q) => !q.played) ?? [];

  const myVoteFor = useCallback((itemId: string) => {
    const item = party?.queue.find((q) => q.id === itemId);
    return item?.votes.some((v) => v.participantId === participantId) ?? false;
  }, [party, participantId]);

  useEffect(() => {
    if (!participantId || !code) {
      navigate("/");
      return;
    }

    let cancelled = false;
    let connectHandler: (() => void) | null = null;

    function joinRoom(partyId: string) {
      socket.emit("party:join", { partyId, participantId });
    }

    import("../lib/api").then(({ getParty }) => {
      getParty(code!).then((data: Party) => {
        if (cancelled) return;
        setParty(data);

        socket.on("party:state", (state: Party) => {
          setParty(state);
        });

        socket.on("song:play", (item: QueueItem) => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = item.previewUrl || "";
            if (item.previewUrl) {
              audioRef.current.play().catch(() => {});
              setIsPlaying(true);
            }
          }
        });

        socket.on("party:ended", (results) => {
          navigate(`/results/${code}`, { state: { results } });
        });

        if (socket.connected) {
          joinRoom(data.id);
        } else {
          connectHandler = () => joinRoom(data.id);
          socket.once("connect", connectHandler);
          socket.connect();
        }
      }).catch(() => { if (!cancelled) navigate("/"); });
    });

    return () => {
      cancelled = true;
      if (connectHandler) socket.off("connect", connectHandler);
      socket.off("party:state");
      socket.off("song:play");
      socket.off("party:ended");
      socket.disconnect();
    };
  }, [code, participantId, navigate]);

  function handleStart() {
    if (!party) return;
    socket.emit("party:start", { partyId: party.id, participantId });
  }

  function handleNext() {
    if (!party) return;
    socket.emit("song:next", { partyId: party.id, participantId });
  }

  function handleEndParty() {
    if (!party) return;
    socket.emit("party:end", { partyId: party.id, participantId });
  }

  function handleAddSong(track: Track) {
    if (!party) return;
    socket.emit("queue:add", { partyId: party.id, participantId, track });
  }

  function handleVote(queueItemId: string) {
    if (!party) return;
    socket.emit("vote:cast", { partyId: party.id, participantId, queueItemId });
  }

  function handlePlayPause() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  if (!party) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <p className="text-white/30 text-sm">Loading party...</p>
        </div>
      </div>
    );
  }

  if (party.status === "lobby") {
    return (
      <>
        <LobbyScreen party={party} isHost={isHost} onStart={handleStart} />
        {/* Search panel accessible in lobby too */}
        <div className="fixed bottom-6 right-6 z-50">
          <AnimatePresence>
            {showSearch && (
              <div className="absolute bottom-16 right-0 w-96">
                <SearchPanel onAdd={handleAddSong} onClose={() => setShowSearch(false)} />
              </div>
            )}
          </AnimatePresence>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowSearch(!showSearch)}
            className="w-12 h-12 rounded-full bg-violet-600 border border-violet-500/50 flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:bg-violet-500"
            style={{ boxShadow: "0 0 30px rgba(124, 58, 237, 0.4)" }}
          >
            {showSearch ? <X size={18} /> : <Plus size={18} />}
          </motion.button>
        </div>
      </>
    );
  }

  const displayNow = nowPlaying;

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Hidden audio */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {displayNow?.albumArt && (
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: `url(${displayNow.albumArt})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(60px) saturate(2)", transition: "background-image 1s" }}
          />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(5,5,5,0.7), rgba(5,5,5,0.95))" }} />
        <div className="glow-pulse absolute -top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/6 blur-[120px]" />
        <div className="glow-pulse absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px]" style={{ animationDelay: "2s" }} />
      </div>

      {/* Top bar */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}
        className="relative z-10 flex items-center justify-between px-6 py-4"
      >
        <div>
          <p className="text-xs text-white/30 uppercase tracking-widest font-medium mb-0.5">{party.code}</p>
          <h1 className="text-lg font-bold tracking-tight">{party.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <AvatarStack participants={party.participants} />
          {isHost && (
            <button
              onClick={handleEndParty}
              className="rounded-full border border-red-500/20 bg-red-500/8 px-3 py-1.5 text-xs font-semibold text-red-400/70 hover:text-red-400 hover:bg-red-500/12 transition-all duration-200"
            >
              End Party
            </button>
          )}
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-4 px-4 pb-6 max-w-6xl mx-auto w-full">
        {/* Left: Now Playing */}
        <div className="flex flex-col gap-4 flex-1">
          <NowPlayingCard
            item={displayNow}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            isHost={isHost}
            myVote={displayNow ? myVoteFor(displayNow.id) : false}
            onVote={() => displayNow && handleVote(displayNow.id)}
            totalVoters={party.participants.length}
          />
          {/* Host next controls */}
          {isHost && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.4 } }}
              className="flex gap-3"
            >
              <button
                onClick={handleNext}
                className="group flex-1 flex items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/8 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                <SkipForward size={16} />
                Next Song
              </button>
            </motion.div>
          )}
        </div>

        {/* Right: Queue */}
        <div className="lg:w-80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest font-medium">Up Next</p>
              <p className="text-[10px] text-white/20 mt-0.5">{upcomingQueue.length} songs in queue</p>
            </div>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="group flex items-center gap-2 rounded-full bg-violet-600/20 border border-violet-500/30 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition-all duration-200"
            >
              <Plus size={12} />
              Add Song
            </button>
          </div>

          <AnimatePresence>
            {showSearch && (
              <SearchPanel onAdd={handleAddSong} onClose={() => setShowSearch(false)} />
            )}
          </AnimatePresence>

          {upcomingQueue.length === 0 ? (
            <div className="rounded-2xl border border-white/6 bg-white/2 flex flex-col items-center justify-center py-12 gap-3">
              <MusicNote size={24} className="text-white/15" />
              <p className="text-white/25 text-sm text-center">Queue is empty<br /><span className="text-white/15 text-xs">Add songs to keep the party going</span></p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-0.5">
              <AnimatePresence>
                {upcomingQueue.map((item, i) => (
                  <QueueRow
                    key={item.id}
                    item={item}
                    index={i}
                    myVote={myVoteFor(item.id)}
                    onVote={() => handleVote(item.id)}
                    isCurrentlyPlaying={false}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
