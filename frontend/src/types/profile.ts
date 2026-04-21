export interface UserStats {
  sessionsPlayed: number;
  totalNet: number;
  biggestWin: number;
  biggestLoss: number;
}

export interface UserSession {
  sessionCode: string;
  date: string;        // ISO date string
  buyIn: number;
  rebuys: number;
  cashOut: number;
  net: number;
  playerCount: number;
}
