// 社区动态相关类型定义
export interface PostUser {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  followers?: number;
}

export interface PostContent {
  images: string[];
  text: string;
  location?: string;
  tags: string[];
}

export interface PostStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface CommunityPost {
  id: string;
  user: PostUser;
  content: PostContent;
  stats: PostStats;
  timestamp: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface PostCreationData {
  text: string;
  images: File[];
  location?: string;
  tags: string[];
}

// 评论相关类型
export interface PostComment {
  id: string;
  postId: string;
  user: PostUser;
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  replies?: PostComment[];
}

// 分享相关类型
export interface ShareOptions {
  platform: 'wechat' | 'weibo' | 'qq' | 'link';
  title: string;
  description: string;
  image?: string;
  url: string;
}