export type Player = {
  playerId: string;
  name: string;
  isReady: boolean;
};

export type Session = {
  sessionCode: string;
  createdAt: string;
  hostUserId?: string;
  players: Player[];
};
