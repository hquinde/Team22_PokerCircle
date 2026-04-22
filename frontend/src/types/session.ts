export type SessionStatus = 'waiting' | 'starting' | 'active' | 'finished';

export interface GameState {
  [key: string]: unknown;
}

export interface Player {
  playerId: string;
  name?: string;
  displayName?: string;
  joinedAt: string;
  isReady: boolean;
  buyIn: number;
  rebuyTotal: number;
  cashOut: number;
  avatar?: string | null;
}

export interface Session {
  sessionCode: string;
  createdAt: string;
  hostUserId: string;
  status: SessionStatus;
  privacy: 'public' | 'private';
  buyInAmount: number;
  maxRebuys: number;
  smallBlind?: number;
  bigBlind?: number;
  privacy: 'public' | 'private';
  players: Player[];
}
