import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Trash2, Edit } from 'lucide-react';
import WaterfallLayout from '../components/community/WaterfallLayout';
import { communityService } from '../services/community/communityService';
import { useAuthStore } from '../store/authStore';

interface CommunityPost {
  id: string;
  content: {
    text: string;
    images: string[];
    location?: string;
    tags: string[];
  };
  user: {
    id: string;
    name: string;
    avatar: string;
    verified?: boolean;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
  timestamp: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

const UserPosts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { posts: fetched } = await communityService.getPosts(1, 50);
      setAllPosts(fetched as any);
      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    // 过滤出当前用户的帖子（未登录也能显示本地发布）
    const userId = user?.id || 'current_user';
    const nameCandidates = [user?.name, '我', '演示用户'].filter(Boolean) as string[];
    const mine = allPosts.filter(p => p.user?.id === userId || (p.user?.name && nameCandidates.includes(p.user.name)));
    setPosts(mine);
  }, [allPosts, user]);

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleEdit = (postId: string) => {
    // 演示：简单替换文本以模拟编辑
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      content: { ...p.content, text: `${p.content.text}（已编辑）` }
    } : p));
  };

  const ItemActions: React.FC<{ post: CommunityPost }> = ({ post }) => (
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span className="flex items-center"><Heart className="w-4 h-4 mr-1" />{post.stats.likes}</span>
        <span className="flex items-center"><MessageCircle className="w-4 h-4 mr-1" />{post.stats.comments}</span>
        <span className="flex items-center"><Share2 className="w-4 h-4 mr-1" />{post.stats.shares}</span>
        <span className="flex items-center"><Bookmark className="w-4 h-4 mr-1" />{post.stats.bookmarks}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => handleEdit(post.id)} className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
          <Edit className="w-3 h-3 inline mr-1" />编辑
        </button>
        <button onClick={() => handleDelete(post.id)} className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">
          <Trash2 className="w-3 h-3 inline mr-1" />删除
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/community')}
              className="px-3 py-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">我的发布</h1>
          </div>
        </div>

        {posts.length === 0 && !isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无我的发布</h3>
            <p className="text-gray-500">去社区发布你的第一条动态吧</p>
          </div>
        ) : (
          <WaterfallLayout
            posts={posts as any}
            onLike={() => {}}
            onBookmark={() => {}}
            onLoadMore={() => {}}
            hasMore={false}
            isLoading={isLoading}
            // 通过子项扩展动作：此处简单在布局组件之外展示动作
          />
        )}

        <div className="mt-6 space-y-4">
          {posts.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="font-medium text-gray-900 mb-2">{p.user?.name || '我'}</div>
              <div className="text-gray-700 mb-2">{p.content.text}</div>
              <ItemActions post={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserPosts;