export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  previewUrl?: string;
  duration: number;
}

export interface Vote {
  id: string;
  queueItemId: string;
  participantId: string;
}

export interface ReplayRequest {
  id: string;
  queueItemId: string;
  participantId: string;
}

export interface QueueItem {
  id: string;
  partyId: string;
  trackId: string;
  title: string;
  artist: string;
  albumArt?: string;
  previewUrl?: string;
  duration: number;
  addedBy: string;
  addedByName: string;
  position: number;
  played: boolean;
  playedAt?: string;
  votes: Vote[];
  replayRequests: ReplayRequest[];
}

export interface Participant {
  id: string;
  partyId: string;
  displayName: string;
  avatarColor: string;
  isHost: boolean;
  socketId?: string;
}

export interface Party {
  id: string;
  code: string;
  name: string;
  hostId: string;
  status: "lobby" | "active" | "ended";
  maxSongs: number;
  maxDuration: number;
  participants: Participant[];
  queue: QueueItem[];
}

export interface RankedItem extends QueueItem {
  voteCount: number;
}
