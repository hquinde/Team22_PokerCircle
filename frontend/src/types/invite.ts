export type InviteStatus = 'pending' | 'accepted' | 'declined';

export type Friend = {
  userId: string;
  username: string;
};

export type FriendRequest = {
  id: number;
  requesterId: string;
  requesterUsername: string;
  createdAt: string;
};

export type SessionInvite = {
  id: number;
  sessionCode: string;
  inviterId: string;
  inviterUsername: string;
  inviteeId: string;
  status: InviteStatus;
  createdAt: string;
};
