import type { CommunityPost, PostCreationData } from '../types/community';
import { useAuthStore } from '../../store/authStore';

const STORAGE_KEY = 'community_user_posts';

const loadStoredPosts = (): CommunityPost[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CommunityPost[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveStoredPosts = (posts: CommunityPost[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (err) {
    console.error('保存用户发布失败:', err);
  }
};

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 模拟数据生成
const generateMockPosts = (): CommunityPost[] => {
  const mockUsers = [
    { id: '1', name: '跑步小仙女', avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20asian%20woman%20runner%20portrait%20professional%20photo&image_size=square', verified: true },
    { id: '2', name: '晨跑达人', avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=handsome%20asian%20man%20runner%20portrait%20professional%20photo&image_size=square' },
    { id: '3', name: '马拉松爱好者', avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=fit%20asian%20athlete%20portrait%20professional%20photo&image_size=square', verified: true },
    { id: '4', name: '夜跑女神', avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20asian%20woman%20night%20runner%20portrait&image_size=square' },
    { id: '5', name: '越野跑者', avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=trail%20runner%20portrait%20professional%20photo&image_size=square' }
  ];

  const mockContents = [
    {
      text: '今天完成了10公里晨跑！黄浦江边的日出真的太美了，跑步的时候心情特别好。坚持运动真的会让人变得更加积极向上。',
      location: '黄浦江畔',
      tags: ['晨跑', '上海', '健康生活', '日出'],
      images: ['https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=shanghai%20huangpu%20river%20sunrise%20morning%20running%20path%20professional%20photo&image_size=portrait_4_3']
    },
    {
      text: '世纪公园跑步打卡！樱花季真的太美了，一边跑步一边赏花，简直是人生享受。今天状态不错，配速5分30秒。',
      location: '世纪公园',
      tags: ['樱花季', '世纪公园', '跑步打卡', '春日'],
      images: ['https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cherry%20blossom%20running%20path%20century%20park%20shanghai%20professional%20photo&image_size=portrait_4_3']
    },
    {
      text: '和跑团的小伙伴们一起完成了今天的训练计划！团队的力量真的很强大，大家一起跑步的感觉太棒了。',
      location: '徐汇滨江',
      tags: ['跑团', '团队训练', '徐汇滨江', '跑步伙伴'],
      images: ['https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=running%20team%20group%20shanghai%20riverside%20professional%20photo&image_size=portrait_4_3']
    },
    {
      text: '夜跑安全小贴士：记得穿反光装备，选择熟悉的路线，告诉家人朋友你的跑步计划。安全第一，健康跑步！',
      location: '陆家嘴',
      tags: ['夜跑', '安全', '跑步装备', '健康'],
      images: ['https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=night%20running%20shanghai%20lujiazui%20skyline%20professional%20photo&image_size=portrait_4_3']
    },
    {
      text: '今天挑战了半马距离！虽然很累，但是突破自己的感觉真的很棒。跑步让我学会了坚持和突破。',
      location: '中山公园',
      tags: ['半马', '挑战', '突破', '坚持'],
      images: ['https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=half%20marathon%20finish%20shanghai%20zhongshan%20park%20professional%20photo&image_size=portrait_4_3']
    }
  ];

  return Array.from({ length: 15 }, (_, index) => {
    const user = mockUsers[index % mockUsers.length];
    const content = mockContents[index % mockContents.length];
    const baseLikes = Math.floor(Math.random() * 500) + 50;
    const baseComments = Math.floor(Math.random() * 100) + 10;
    const baseShares = Math.floor(Math.random() * 50) + 5;
    const baseBookmarks = Math.floor(Math.random() * 80) + 10;

    return {
      id: `post_${index + 1}`,
      user,
      content,
      stats: {
        likes: baseLikes + Math.floor(Math.random() * 200),
        comments: baseComments + Math.floor(Math.random() * 50),
        shares: baseShares + Math.floor(Math.random() * 30),
        bookmarks: baseBookmarks + Math.floor(Math.random() * 40)
      },
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      isLiked: Math.random() > 0.7,
      isBookmarked: Math.random() > 0.8
    };
  });
};

export const communityService = {
  // 获取社区动态
  async getPosts(page: number = 1, limit: number = 10): Promise<{ posts: CommunityPost[]; hasMore: boolean }> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stored = loadStoredPosts();
    const allPosts = [...stored, ...generateMockPosts()].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return tb - ta;
    });
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const posts = allPosts.slice(startIndex, endIndex);
    const hasMore = endIndex < allPosts.length;

    return { posts, hasMore };
  },

  // 创建新动态
  async createPost(data: PostCreationData): Promise<CommunityPost> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const state = useAuthStore.getState();
    const currentUser = state.user || { id: 'current_user', name: '我', email: 'demo@example.com' } as any;

    const images: string[] = data.images && data.images.length
      ? await Promise.all(data.images.map(readFileAsDataURL))
      : [];

    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      user: {
        id: currentUser.id,
        name: currentUser.name || '我',
        avatar: currentUser.avatar || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=runner%20avatar%20professional%20photo&image_size=square'
      },
      content: {
        text: data.text,
        images,
        location: data.location,
        tags: data.tags
      },
      stats: {
        likes: 0,
        comments: 0,
        shares: 0,
        bookmarks: 0
      },
      timestamp: new Date().toISOString(),
      isLiked: false,
      isBookmarked: false
    };
    // 写入本地存储
    const stored = loadStoredPosts();
    const nextStored = [newPost, ...stored];
    saveStoredPosts(nextStored);

    return newPost;
  },

  // 点赞/取消点赞
  async toggleLike(postId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return Math.random() > 0.5;
  },

  // 收藏/取消收藏
  async toggleBookmark(postId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return Math.random() > 0.5;
  },

  // 分享
  async sharePost(postId: string, platform: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
};