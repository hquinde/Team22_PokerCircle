export interface Player {
  playerId: string;
  name: string;
}

export interface Session {
  sessionCode: string;
  createdAt: string; // ISO string is easiest for JSON
  players: Player[];
}
