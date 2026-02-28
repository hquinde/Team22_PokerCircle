export type Player = {
  playerId: string;
  name: string;
};

export type Session = {
  sessionCode: string;
  createdAt: string;
  players: Player[];
};
