export interface ClubActivity {
  id: string;
  title: string;
  time: string; // ISO string
  location: string;
  distanceKm?: number;
  signupCount?: number;
}

export interface Club {
  id: string;
  name: string;
  coverImage: string;
  membersCount: number;
  likes: number;
  commentsCount: number;
  tags: string[];
  latestActivity?: ClubActivity;
  heatScore?: number; // 预计算热度
  distanceKm?: number; // 与用户距离（示例）
  description?: string;
}

export type ClubSortKey = 'heat' | 'distance' | 'activityTime';

export interface ClubQueryOptions {
  sortBy?: ClubSortKey;
  limit?: number;
  personalized?: boolean;
}

export interface ClubComment {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  likes: number;
}