export interface UserStats {
  sessionsPlayed: number;
  totalNet: number;
  biggestWin: number;
  biggestLoss: number;
}

export interface UserSession {
  sessionCode: string;
  date: string;        // ISO date string
  net: number;
  playerCount: number;
}
