export type SessionStatus = 'waiting' | 'starting' | 'active' | 'finished';

export interface GameState {
  [key: string]: any;
}

export interface Player {
  playerId: string;
  displayName: string;
  joinedAt: string;
  isReady: boolean;
  buyIn: number;
  rebuyTotal: number;
  cashOut: number;
  cashOutConfirmed: boolean;
}

export interface Session {
  sessionCode: string;
  hostUserId: string;
  status: SessionStatus;
  gameState: GameState;
  createdAt: string;
  players: Player[];
}
