import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Pause, SkipForward, MagnifyingGlass, Fire, Users,
  Copy, Check, Crown, MusicNote, Plus, ArrowRight, X, LinkSimple,
  DotsThreeVertical, ArrowFatLinesUp, DotsSixVertical, ClockCounterClockwise,
} from "@phosphor-icons/react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { socket } from "../lib/socket";
import { searchMusic, getParty } from "../lib/api";
import type { Party, Participant, QueueItem, Track } from "../lib/types";

// ─── Audio Waveform ───────────────────────────────────────────────────────────

function Waveform({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full bg-[#ffb340] ${playing ? "wave-bar" : ""}`}
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

function formatTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function NowPlayingCard({
  item, isPlaying, onPlayPause, myVote, onVote, totalVoters, currentTime, duration, onSeek, isHost,
}: {
  item: QueueItem | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  myVote: boolean;
  onVote: () => void;
  totalVoters: number;
  currentTime: number;
  duration: number;
  onSeek: (t: number) => void;
  isHost: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* ── Compact card ── */}
      <motion.div
        key={item.id}
        initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } }}
        className="rounded-[2rem] border border-white/10 p-1.5 flex-1 flex flex-col"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        <div
          className="rounded-[calc(2rem-0.375rem)] overflow-hidden relative h-full flex flex-col"
          style={{ background: "rgba(8,8,12,0.9)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)" }}
        >
          {item.albumArt && (<>
            {/* Color atmosphere — blurred cover fill */}
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${item.albumArt})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(50px) saturate(2)" }} />
            {/* Actual image — contained, full, no crop */}
            <div className="absolute inset-0" style={{ backgroundImage: `url(${item.albumArt})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center", opacity: 0.18, filter: "brightness(0.7)" }} />
          </>)}
          <div className="relative z-10 p-8 flex flex-col flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Waveform playing={isPlaying} />
                <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium">Now Playing</span>
              </div>
              {item.addedByName && <span className="text-[10px] text-white/25 font-medium">added by {item.addedByName}</span>}
            </div>

            {/* Art + info */}
            <div className="flex gap-6 items-center mb-6">
              {item.albumArt ? (
                <motion.div
                  layoutId={`album-art-${item.id}`}
                  onClick={() => setExpanded(true)}
                  className="rounded-[1.2rem] border border-white/10 p-1 flex-shrink-0 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                >
                  <img src={item.albumArt} alt={item.title} className="w-24 h-24 rounded-[calc(1.2rem-0.25rem)] object-cover" />
                </motion.div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <MusicNote size={32} className="text-white/20" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold tracking-tight leading-tight truncate mb-1">{item.title}</h2>
                <p className="text-white/50 text-sm truncate mb-3">{item.artist}</p>
                {isHost ? (
                  <button
                    onClick={onPlayPause}
                    className="flex items-center gap-2 rounded-full bg-white/8 border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/12 transition-all duration-200 active:scale-95"
                  >
                    {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                    {isPlaying ? "Pause" : "Play"}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-white/25 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-[#ffb340] animate-pulse" : "bg-white/20"}`} />
                    {isPlaying ? "Synced with host" : "Paused by host"}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-auto">
              <div className="mb-5">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => isHost && onSeek(Number(e.target.value))}
                  disabled={!isHost}
                  className={`w-full h-1 rounded-full appearance-none ${isHost ? "cursor-pointer" : "cursor-default"}`}
                  style={{ background: `linear-gradient(to right, #FF9700 ${progress}%, rgba(255,255,255,0.12) ${progress}%)`, outline: "none" }}
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-white/30 font-mono">{formatTime(currentTime)}</span>
                  <span className="text-[10px] text-white/20 font-mono">{formatTime(duration)}</span>
                </div>
              </div>
              <motion.button
                onClick={onVote}
                whileTap={{ scale: 0.92 }}
                className={`flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  myVote ? "bg-orange-500/20 border border-orange-500/40 text-orange-400"
                         : "bg-white/8 border border-white/10 text-white/50 hover:bg-white/12 hover:text-white/70"
                }`}
              >
                <Fire size={16} weight={myVote ? "fill" : "regular"} className={myVote ? "text-orange-400" : ""} />
                <span>{item.votes.length}</span>
                {totalVoters > 0 && <span className="text-[10px] opacity-50">/ {totalVoters}</span>}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Full-screen backdrop overlay ── */}
      <AnimatePresence>
        {expanded && item.albumArt && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.4 } }}
              exit={{ opacity: 0, transition: { duration: 0.35 } }}
              className="fixed inset-0 z-[150]"
              onClick={() => setExpanded(false)}
              style={{ backdropFilter: "blur(2px)" }}
            >
              {/* Layer 1: color atmosphere */}
              <div className="absolute inset-0" style={{ backgroundImage: `url(${item.albumArt})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(40px) saturate(2.5) brightness(0.3)" }} />
              {/* Layer 2: actual image — contained, full, recognisable */}
              <div className="absolute inset-0" style={{ backgroundImage: `url(${item.albumArt})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center", filter: "brightness(0.55)", opacity: 0.85 }} />
              <div className="absolute inset-0 bg-black/50" />
            </motion.div>

            {/* Content panel */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}
              exit={{ opacity: 0, y: 32, transition: { duration: 0.3 } }}
              className="fixed inset-0 z-[151] flex flex-col items-center justify-center px-8 pointer-events-none"
            >
              {/* Close hint */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.4 } }}
                exit={{ opacity: 0 }}
                onClick={() => setExpanded(false)}
                className="pointer-events-auto absolute top-8 right-8 w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all duration-200"
              >
                <X size={16} />
              </motion.button>

              <div className="flex flex-col items-center gap-8 w-full max-w-sm pointer-events-auto">
                {/* Expanding album art via layoutId */}
                <motion.div
                  layoutId={`album-art-${item.id}`}
                  className="rounded-[2rem] border border-white/20 p-1.5 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                  onClick={() => setExpanded(false)}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                >
                  <img
                    src={item.albumArt}
                    alt={item.title}
                    className="w-72 h-72 rounded-[calc(2rem-0.375rem)] object-cover"
                  />
                </motion.div>

                {/* Song info */}
                <div className="text-center">
                  <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-1">{item.title}</h2>
                  <p className="text-white/50 text-base">{item.artist}</p>
                </div>

                {/* Controls */}
                <div className="w-full">
                  {isHost && (
                    <div className="flex justify-center mb-6">
                      <button
                        onClick={onPlayPause}
                        className="w-16 h-16 rounded-full flex items-center justify-center text-black font-bold transition-all duration-200 active:scale-95 shadow-[0_0_40px_rgba(255,151,0,0.5)]"
                        style={{ background: "#FF9700" }}
                      >
                        {isPlaying ? <Pause size={24} weight="fill" /> : <Play size={24} weight="fill" />}
                      </button>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="mb-5">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => isHost && onSeek(Number(e.target.value))}
                      disabled={!isHost}
                      className={`w-full h-1.5 rounded-full appearance-none ${isHost ? "cursor-pointer" : "cursor-default"}`}
                      style={{ background: `linear-gradient(to right, #FF9700 ${progress}%, rgba(255,255,255,0.15) ${progress}%)`, outline: "none" }}
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-white/40 font-mono">{formatTime(currentTime)}</span>
                      <span className="text-xs text-white/25 font-mono">{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Vote */}
                  <div className="flex justify-center">
                    <motion.button
                      onClick={onVote}
                      whileTap={{ scale: 0.92 }}
                      className={`flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                        myVote ? "bg-orange-500/25 border border-orange-500/50 text-orange-400"
                               : "bg-white/10 border border-white/15 text-white/60 hover:bg-white/15"
                      }`}
                    >
                      <Fire size={16} weight={myVote ? "fill" : "regular"} className={myVote ? "text-orange-400" : ""} />
                      <span>{item.votes.length}</span>
                      {totalVoters > 0 && <span className="text-[10px] opacity-50">/ {totalVoters}</span>}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Queue Item Row (Sortable) ────────────────────────────────────────────────

function QueueRow({
  item, myVote, onVote, isHost, onMoveToTop, onSkipTo,
}: {
  item: QueueItem;
  myVote: boolean;
  onVote: () => void;
  isHost: boolean;
  onMoveToTop: (id: string) => void;
  onSkipTo: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const dotsBtnRef = useRef<HTMLButtonElement>(null);

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: item.id, disabled: !isHost });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    if (dotsBtnRef.current) {
      const rect = dotsBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.top, right: window.innerWidth - rect.right });
    }
    setMenuOpen(true);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function close() { setMenuOpen(false); }
    document.addEventListener("mousedown", close, { once: true });
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onClick={() => !isDragging && onSkipTo(item.id)}
        className={`group flex items-center gap-3 rounded-2xl border p-3 transition-colors duration-200 cursor-pointer ${
          isDragging
            ? "border-[#e07600]/40 bg-[#e07600]/10 shadow-[0_8px_32px_rgba(124,58,237,0.2)]"
            : "border-white/6 bg-white/3 hover:bg-white/5 hover:border-[#e07600]/20"
        }`}
      >
        {/* Drag handle — host only, stops propagation so row click doesn't fire */}
        {isHost && (
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing transition-colors duration-150 touch-none"
            tabIndex={-1}
          >
            <DotsSixVertical size={16} />
          </button>
        )}

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

        {/* Vote button — stops row click */}
        <button
          onClick={(e) => { e.stopPropagation(); onVote(); }}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
            myVote ? "bg-orange-500/20 text-orange-400" : "bg-white/5 text-white/30 hover:bg-white/8 hover:text-white/50"
          }`}
        >
          <Fire size={12} weight={myVote ? "fill" : "regular"} />
          {item.votes.length}
        </button>

        {/* Three-dot menu — host only, fixed-position portal */}
        {isHost && (
          <button
            ref={dotsBtnRef}
            onClick={openMenu}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/8 transition-all duration-150"
          >
            <DotsThreeVertical size={15} weight="bold" />
          </button>
        )}
      </div>

      {/* Menu portal — renders outside any overflow:hidden ancestor */}
      {isHost && menuOpen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: [0.32, 0.72, 0, 1] } }}
            exit={{ opacity: 0, scale: 0.92, y: 6, transition: { duration: 0.1 } }}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[300] w-48 rounded-2xl border border-white/10 p-1 shadow-[0_8px_48px_rgba(0,0,0,0.8)]"
            style={{
              background: "rgba(18,18,24,0.99)",
              backdropFilter: "blur(24px)",
              top: menuPos.top - 8,
              right: menuPos.right,
              transform: "translateY(-100%)",
            }}
          >
            <button
              onClick={() => { onSkipTo(item.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all duration-150 text-left"
            >
              <Play size={13} weight="fill" className="text-[#ffb340]" />
              Play Now
            </button>
            <button
              onClick={() => { onMoveToTop(item.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all duration-150 text-left"
            >
              <ArrowFatLinesUp size={13} weight="fill" className="text-[#ffb340]" />
              Move to Top
            </button>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// ─── Song Search Modal ────────────────────────────────────────────────────────

function SearchModal({ onAdd, onClose, queueTrackIds }: { onAdd: (track: Track) => void; onClose: () => void; queueTrackIds: Set<string> }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try { setResults(await searchMusic(query)); } catch { /* ignore */ }
      setLoading(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // A track shows a tick if it's in the party queue OR was just added this session
  function isAdded(trackId: string) {
    return queueTrackIds.has(trackId) || justAdded.has(trackId);
  }

  function handleAdd(track: Track) {
    onAdd(track);
    setJustAdded(prev => new Set(prev).add(track.id));
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } }}
        exit={{ opacity: 0, scale: 0.94, y: 24, transition: { duration: 0.25 } }}
        className="w-full max-w-lg rounded-[2rem] border border-white/10 p-1.5"
        style={{ background: "rgba(255,255,255,0.04)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-[calc(2rem-0.375rem)] p-6" style={{ background: "rgba(10,10,14,0.98)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)" }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] font-medium text-white/40 mb-1">
                Add Songs
              </span>
              <h3 className="text-xl font-bold tracking-tight">What's going in the queue?</h3>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/8 transition-all duration-200"
            >
              <X size={15} />
            </button>
          </div>

          {/* Search input */}
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 mb-4" style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)" }}>
            <MagnifyingGlass size={15} className="text-white/30 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search artist, song or album..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none"
            />
            {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin flex-shrink-0" />}
          </div>

          {/* Results */}
          <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5">
            <AnimatePresence>
              {results.map((track, i) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.035 } }}
                  className={`flex items-center gap-3 rounded-xl p-2.5 transition-all duration-150 group ${isAdded(track.id) ? "opacity-60 cursor-default" : "hover:bg-white/5 cursor-pointer"}`}
                  onClick={() => !isAdded(track.id) && handleAdd(track)}
                >
                  {track.albumArt ? (
                    <img src={track.albumArt} alt={track.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <MusicNote size={14} className="text-white/20" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{track.title}</p>
                    <p className="text-xs text-white/40 truncate">{track.artist}</p>
                  </div>
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 bg-white/0 group-hover:bg-[#e07600]/20">
                    {isAdded(track.id) ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <Plus size={14} className="text-white/25 group-hover:text-[#ffb340] transition-colors duration-150" />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!loading && query && results.length === 0 && (
              <p className="text-center text-white/25 text-sm py-10">No results found</p>
            )}
            {!query && (
              <div className="flex flex-col items-center gap-2 py-10">
                <MagnifyingGlass size={24} className="text-white/15" />
                <p className="text-center text-white/20 text-sm">Start typing to search</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ─── Lobby Screen ─────────────────────────────────────────────────────────────

function LobbyScreen({
  party, isHost, onStart, onAddSong,
}: {
  party: Party;
  isHost: boolean;
  onStart: () => void;
  onAddSong: () => void;
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
        <div className="glow-pulse absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-[#FF9700]/8 blur-[120px]" />
        <div className="glow-pulse absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#e07600]/6 blur-[100px]" style={{ animationDelay: "1.5s" }} />
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
              <span className="text-5xl font-extrabold tracking-widest font-mono" style={{ background: "linear-gradient(135deg, #FF9700, #c96500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
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
          <div className="flex flex-col gap-3">
            <button
              onClick={onAddSong}
              className="group w-full flex items-center justify-center gap-3 rounded-full border border-[#e07600]/30 bg-[#FF9700]/15 px-6 py-3.5 text-sm font-semibold text-[#ffd080] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#FF9700]/25 hover:text-white active:scale-[0.98]"
            >
              <Plus size={15} />
              Add Songs {party.queue.length > 0 && <span className="ml-1 rounded-full bg-[#e07600]/30 px-2 py-0.5 text-[10px] text-[#ffd080]">{party.queue.length} added</span>}
            </button>
            <button
              onClick={onStart}
              disabled={party.queue.length === 0}
              className="group w-full flex items-center justify-center gap-3 rounded-full bg-[#FF9700] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#e07600] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ boxShadow: "0 0 40px rgba(255, 151, 0, 0.4)" }}
            >
              Start the Party
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <ArrowRight size={12} weight="bold" />
              </span>
            </button>
            {party.queue.length === 0 && (
              <p className="text-center text-white/25 text-xs">Add at least one song to start</p>
            )}
          </div>
        ) : (
          <p className="text-center text-white/30 text-sm">Waiting for the host to start the party...</p>
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isHostRef = useRef(false);
  // Holds a song that arrived before the <audio> element was mounted
  const pendingSongRef = useRef<QueueItem | null>(null);

  const isHost = party?.hostId === participantId;
  isHostRef.current = isHost;

  const nowPlaying = party?.queue.find((q) => q.played && !party.queue.some((after) => after.position > q.position && after.played)) ?? null;
  const upcomingQueue = party?.queue.filter((q) => !q.played) ?? [];
  // displayNow: prefer the actively-playing song (tracked by ID) so replays show correctly
  const displayNow = (currentSongId ? (party?.queue.find((q) => q.id === currentSongId) ?? null) : null) ?? nowPlaying;
  const playedQueue = party?.queue.filter((q) => q.played && q.id !== displayNow?.id).reverse() ?? [];

  const myVoteFor = useCallback((itemId: string) => {
    const item = party?.queue.find((q) => q.id === itemId);
    return item?.votes.some((v) => v.participantId === participantId) ?? false;
  }, [party, participantId]);

  const myReplayFor = useCallback((itemId: string) => {
    const item = party?.queue.find((q) => q.id === itemId);
    return item?.replayRequests.some((r) => r.participantId === participantId) ?? false;
  }, [party, participantId]);

  const queueTrackIds = new Set(party?.queue.map((q) => q.trackId) ?? []);

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

    getParty(code!).then((data: Party) => {
        if (cancelled) return;
        setParty(data);

        socket.on("party:state", (state: Party) => {
          setParty(state);
        });

        socket.on("song:play", (item: QueueItem) => {
          setCurrentSongId(item.id);
          setCurrentTime(0);
          setDuration(0);
          if (audioRef.current) {
            playSong(item);
          } else {
            // Audio element not mounted yet (lobby→active transition race).
            // Store it; the ref callback will drain it once the element mounts.
            pendingSongRef.current = item;
          }
        });

        socket.on("party:ended", (results) => {
          navigate(`/results/${code}`, { state: { results } });
        });

        socket.on("playback:control", ({ action, time }: { action: string; time?: number }) => {
          const audio = audioRef.current;
          if (!audio) return;
          if (action === "pause") {
            audio.pause();
            setIsPlaying(false);
          } else if (action === "resume") {
            audio.play().catch(() => {});
            setIsPlaying(true);
          } else if (action === "seek" && time !== undefined) {
            audio.currentTime = time;
            setCurrentTime(time);
          }
        });

        if (socket.connected) {
          joinRoom(data.id);
        } else {
          connectHandler = () => joinRoom(data.id);
          socket.once("connect", connectHandler);
          socket.connect();
        }
      }).catch(() => { if (!cancelled) navigate("/"); });

    return () => {
      cancelled = true;
      if (connectHandler) socket.off("connect", connectHandler);
      socket.off("party:state");
      socket.off("song:play");
      socket.off("party:ended");
      socket.off("playback:control");
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    if (!party) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = upcomingQueue.map((q) => q.id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    const reordered = arrayMove(ids, oldIdx, newIdx);

    socket.emit("queue:reorder", { partyId: party.id, participantId, orderedIds: reordered });
  }

  function handleMoveToTop(itemId: string) {
    if (!party) return;
    const ids = upcomingQueue.map((q) => q.id);
    const idx = ids.indexOf(itemId);
    if (idx <= 0) return;
    const reordered = [itemId, ...ids.filter((id) => id !== itemId)];
    socket.emit("queue:reorder", { partyId: party.id, participantId, orderedIds: reordered });
  }

  function playSong(item: QueueItem) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = item.previewUrl || "";
    audio.currentTime = 0;
    if (item.previewUrl) {
      audio.load(); // ensure src is picked up before play()
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }

  // Ref callback: fires the moment the <audio> element mounts.
  // If a song:play arrived before the element existed, play it now.
  function setAudioRef(el: HTMLAudioElement | null) {
    (audioRef as React.MutableRefObject<HTMLAudioElement | null>).current = el;
    if (el && pendingSongRef.current) {
      const item = pendingSongRef.current;
      pendingSongRef.current = null;
      playSong(item);
    }
  }

  function handleSkipTo(queueItemId: string) {
    if (!party) return;
    socket.emit("song:skip-to", { partyId: party.id, participantId, queueItemId });
  }

  function handleReplay(queueItemId: string) {
    if (!party) return;
    socket.emit("song:replay", { partyId: party.id, participantId, queueItemId });
  }

  function handleReplayToggle(queueItemId: string) {
    if (!party) return;
    socket.emit("replay:toggle", { partyId: party.id, participantId, queueItemId });
  }

  function handleSeek(time: number) {
    if (!audioRef.current || !party) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    // Broadcast to guests
    socket.emit("playback:control", { partyId: party.id, participantId, action: "seek", time });
  }

  function handlePlayPause() {
    if (!audioRef.current || !party) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      socket.emit("playback:control", { partyId: party.id, participantId, action: "pause" });
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
      socket.emit("playback:control", { partyId: party.id, participantId, action: "resume" });
    }
  }

  if (!party) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#e07600]/30 border-t-[#e07600] animate-spin" />
          <p className="text-white/30 text-sm">Loading party...</p>
        </div>
      </div>
    );
  }

  if (party.status === "lobby") {
    return (
      <>
        <LobbyScreen
          party={party}
          isHost={isHost}
          onStart={handleStart}
          onAddSong={() => setShowSearch(true)}
        />
        <AnimatePresence>
          {showSearch && <SearchModal onAdd={handleAddSong} onClose={() => setShowSearch(false)} queueTrackIds={queueTrackIds} />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Hidden audio — uses ref callback so pending songs are drained the moment it mounts */}
      <audio
        ref={setAudioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => { setDuration(audioRef.current?.duration ?? 0); setCurrentTime(0); }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (isHostRef.current) {
            socket.emit("song:next", { partyId: party?.id, participantId });
          }
        }}
      />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {displayNow?.albumArt && (
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: `url(${displayNow.albumArt})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(60px) saturate(2)", transition: "background-image 1s" }}
          />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(5,5,5,0.7), rgba(5,5,5,0.95))" }} />
        <div className="glow-pulse absolute -top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-[#FF9700]/6 blur-[120px]" />
        <div className="glow-pulse absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#e07600]/5 blur-[100px]" style={{ animationDelay: "2s" }} />
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
            myVote={displayNow ? myVoteFor(displayNow.id) : false}
            onVote={() => displayNow && handleVote(displayNow.id)}
            totalVoters={party.participants.length}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            isHost={isHost}
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
              className="group flex items-center gap-2 rounded-full bg-[#FF9700]/20 border border-[#e07600]/30 px-3 py-1.5 text-xs font-semibold text-[#ffd080] hover:bg-[#FF9700]/30 transition-all duration-200"
            >
              <Plus size={12} />
              Add Song
            </button>
          </div>

          {upcomingQueue.length === 0 ? (
            <div className="rounded-2xl border border-white/6 bg-white/2 flex flex-col items-center justify-center py-12 gap-3">
              <MusicNote size={24} className="text-white/15" />
              <p className="text-white/25 text-sm text-center">Queue is empty<br /><span className="text-white/15 text-xs">Add songs to keep the party going</span></p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={upcomingQueue.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 overflow-y-auto max-h-[45vh] pr-0.5">
                  {upcomingQueue.map((item) => (
                    <QueueRow
                      key={item.id}
                      item={item}
                      myVote={myVoteFor(item.id)}
                      onVote={() => handleVote(item.id)}
                      isHost={isHost}
                      onMoveToTop={handleMoveToTop}
                      onSkipTo={handleSkipTo}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Played history */}
          {playedQueue.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-white/20 uppercase tracking-widest font-medium flex items-center gap-1.5 mb-2">
                <ClockCounterClockwise size={11} />
                Played
              </p>
              <div className="space-y-1.5">
                {playedQueue.map((item) => {
                  const myReplay = myReplayFor(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => isHost ? handleReplay(item.id) : handleReplayToggle(item.id)}
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition-all duration-200 group cursor-pointer ${
                        displayNow?.id === item.id
                          ? "border-[#e07600]/30 bg-[#e07600]/8 opacity-100"
                          : myReplay && !isHost
                            ? "border-[#FF9700]/20 bg-[#FF9700]/5 opacity-100"
                            : "border-white/4 bg-white/2 opacity-60 hover:opacity-100 hover:border-white/10"
                      }`}
                    >
                      {item.albumArt ? (
                        <img src={item.albumArt} alt={item.title} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-300" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                          <MusicNote size={14} className="text-white/20" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate text-white/60">{item.title}</p>
                        <p className="text-[10px] text-white/30 truncate">{item.artist}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isHost ? (
                          /* Host sees two stats: fire votes + replay requests */
                          <>
                            <div className="flex items-center gap-1 rounded-full px-2 py-1 bg-white/4 border border-white/8 cursor-default select-none" title="Competition fire votes">
                              <Fire size={9} weight="fill" className="text-orange-400/50" />
                              <span className="text-[10px] text-white/35">{item.votes.length}</span>
                            </div>
                            <div className="flex items-center gap-1 rounded-full px-2 py-1 bg-white/4 border border-white/8 cursor-default select-none" title="Participants want to hear again">
                              <ClockCounterClockwise size={9} className="text-[#ffb340]/50" />
                              <span className="text-[10px] text-white/35">{item.replayRequests.length}</span>
                            </div>
                          </>
                        ) : (
                          /* Guest: replay request toggle */
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReplayToggle(item.id); }}
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all duration-200 ${
                              myReplay
                                ? "bg-[#FF9700]/20 border border-[#FF9700]/30 text-[#ffb340]"
                                : "bg-white/5 border border-white/8 text-white/30 hover:text-[#ffb340] hover:bg-[#FF9700]/10"
                            }`}
                          >
                            <ClockCounterClockwise size={10} weight={myReplay ? "fill" : "regular"} />
                            {item.replayRequests.length}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    {/* Search modal — portal renders outside the party layout */}
    <AnimatePresence>
      {showSearch && <SearchModal onAdd={handleAddSong} onClose={() => setShowSearch(false)} queueTrackIds={queueTrackIds} />}
    </AnimatePresence>
    </>
  );
}
