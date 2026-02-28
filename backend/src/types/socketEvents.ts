import type { Player } from './session';

export type JoinRoomPayload = {
  sessionCode: string;
  playerName: string;
};

export type LobbyUpdatePayload = {
  sessionCode: string;
  players: Player[];
};
