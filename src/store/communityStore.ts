import { create } from 'zustand';
import type { CommunityPost, PostCreationData, PostComment } from '../types/community';

interface CommunityState {
  posts: CommunityPost[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  
  // 操作状态
  isCreatingPost: boolean;
  selectedPost: CommunityPost | null;
  comments: Record<string, PostComment[]>; // postId -> comments
  
  // 动作
  setPosts: (posts: CommunityPost[]) => void;
  addPosts: (posts: CommunityPost[]) => void;
  addPost: (post: CommunityPost) => void;
  updatePost: (postId: string, updates: Partial<CommunityPost>) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  incrementPage: () => void;
  resetPage: () => void;
  
  // 创建动态
  setCreatingPost: (creating: boolean) => void;
  
  // 选中动态
  setSelectedPost: (post: CommunityPost | null) => void;
  
  // 评论相关
  setComments: (postId: string, comments: PostComment[]) => void;
  addComment: (postId: string, comment: PostComment) => void;
  updateComment: (postId: string, commentId: string, updates: Partial<PostComment>) => void;
  
  // 点赞相关
  toggleLike: (postId: string) => void;
  toggleBookmark: (postId: string) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  isLoading: false,
  hasMore: true,
  page: 1,
  isCreatingPost: false,
  selectedPost: null,
  comments: {},

  setPosts: (posts) => set({ posts }),
  
  addPosts: (newPosts) => set((state) => ({
    posts: [...state.posts, ...newPosts]
  })),
  
  addPost: (post) => set((state) => ({
    posts: [post, ...state.posts]
  })),
  
  updatePost: (postId, updates) => set((state) => ({
    posts: state.posts.map(post => 
      post.id === postId ? { ...post, ...updates } : post
    )
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setHasMore: (hasMore) => set({ hasMore }),
  
  incrementPage: () => set((state) => ({ page: state.page + 1 })),
  
  resetPage: () => set({ page: 1, posts: [], hasMore: true }),
  
  setCreatingPost: (creating) => set({ isCreatingPost: creating }),
  
  setSelectedPost: (post) => set({ selectedPost: post }),
  
  setComments: (postId, comments) => set((state) => ({
    comments: { ...state.comments, [postId]: comments }
  })),
  
  addComment: (postId, comment) => set((state) => ({
    comments: {
      ...state.comments,
      [postId]: [...(state.comments[postId] || []), comment]
    }
  })),
  
  updateComment: (postId, commentId, updates) => set((state) => ({
    comments: {
      ...state.comments,
      [postId]: (state.comments[postId] || []).map(comment =>
        comment.id === commentId ? { ...comment, ...updates } : comment
      )
    }
  })),
  
  toggleLike: (postId) => set((state) => ({
    posts: state.posts.map(post => {
      if (post.id === postId) {
        const newIsLiked = !post.isLiked;
        return {
          ...post,
          isLiked: newIsLiked,
          stats: {
            ...post.stats,
            likes: newIsLiked ? post.stats.likes + 1 : post.stats.likes - 1
          }
        };
      }
      return post;
    })
  })),
  
  toggleBookmark: (postId) => set((state) => ({
    posts: state.posts.map(post => 
      post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post
    )
  })),
  
  toggleCommentLike: (postId, commentId) => set((state) => ({
    comments: {
      ...state.comments,
      [postId]: (state.comments[postId] || []).map(comment => {
        if (comment.id === commentId) {
          const newIsLiked = !comment.isLiked;
          return {
            ...comment,
            isLiked: newIsLiked,
            likes: newIsLiked ? comment.likes + 1 : comment.likes - 1
          };
        }
        return comment;
      })
    }
  }))
}));