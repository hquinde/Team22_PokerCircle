export type SessionStatus = 'waiting' | 'starting' | 'active' | 'finished';

export interface GameState {
  // To be expanded as game logic is implemented
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
}

export interface Session {
  sessionCode: string;
  hostUserId: string;
  status: SessionStatus;
  gameState: GameState;
  createdAt: string;
  players: Player[];
}
