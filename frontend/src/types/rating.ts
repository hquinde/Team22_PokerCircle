export interface PlayerRating {
    ratedUserId: string;
    stars: number; // 1–5
  }
  
  export interface RatingSubmission {
    ratedUserId: string;
    sessionId: string;
    stars: number;
  }
  
  export interface UserProfile {
    userId: string;
    username: string;
    avatar: string | null;
    avgRating: number;
    ratingsCount: number;
  }