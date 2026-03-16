export type SessionStatus = 'lobby' | 'starting' | 'active' | 'finished';

export interface GameState {
  [key: string]: any;
}

export interface Player {
  playerId: number;
  displayName: string;
  joinedAt: string;
}

export interface Session {
  sessionId: number;
  sessionCode: string;
  status: SessionStatus;
  gameState: GameState;
  createdAt: string;
  players: Player[];
}
