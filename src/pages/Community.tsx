import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Filter, Plus, MapPin, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WaterfallLayout from '../components/community/WaterfallLayout';
import PostCreator from '../components/community/PostCreator';
import ClubSidebarModule from '../components/community/ClubSidebarModule';
import { communityService } from '../services/community/communityService';

// 临时定义社区状态管理，避免导入错误
interface CommunityPost {
  id: string;
  content: string;
  images: string[];
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  location?: string;
  distance?: number;
  pace?: string;
  duration?: string;
}

const Community: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const navigate = useNavigate();

  // 删除历史对话相关状态
  // const [showHistoryPanel, setShowHistoryPanel] = useState(true);
  const [voiceDebugActive, setVoiceDebugActive] = useState(false);

  // 加载初始数据
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (isLoadMore = false) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const currentPage = isLoadMore ? page : 1;
      const { posts: newPosts, hasMore: more } = await communityService.getPosts(currentPage);
      
      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(more);
      if (isLoadMore) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('加载动态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (postData: any) => {
    try {
      const newPost = await communityService.createPost(postData);
      setPosts(prev => [newPost, ...prev]);
      setIsCreatorOpen(false);
    } catch (error) {
      console.error('创建动态失败:', error);
    }
  };

  const handleLoadMore = () => {
    loadPosts(true);
  };

  const handleToggleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
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
    }));
  };

  const handleToggleBookmark = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post
    ));
  };

  // 排序：按时间（最新在前）
  const sortByTime = () => {
    setPosts(prev => {
      const sorted = [...prev].sort((a: any, b: any) => {
        const ta = new Date(a.timestamp || a.createdAt).getTime();
        const tb = new Date(b.timestamp || b.createdAt).getTime();
        return tb - ta; // 最新在前
      });
      return sorted;
    });
  };

  // 排序：按点赞数量（多到少）
  const sortByLikes = () => {
    setPosts(prev => {
      const sorted = [...prev].sort((a: any, b: any) => {
        const la = a.stats?.likes ?? 0;
        const lb = b.stats?.likes ?? 0;
        return lb - la;
      });
      return sorted;
    });
  };

  // 跳转我的发布
  const goMyPosts = () => {
    navigate('/my-posts');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              跑步社区
            </h1>
            <p className="text-gray-600 mt-1">分享你的跑步故事，发现更多跑步爱好者</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm">筛选</span>
            </button>
            <button
              onClick={() => setIsCreatorOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">发布动态</span>
            </button>
          </div>
        </div>

        {/* 社区工具栏：排序与我的发布 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">社区工具</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={sortByTime}
              className="w-full px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
            >
              按时间排序
            </button>
            <button
              onClick={sortByLikes}
              className="w-full px-4 py-3 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 transition-colors"
            >
              按点赞排序
            </button>
            <button
              onClick={goMyPosts}
              className="w-full px-4 py-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors"
            >
              我的发布
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* 主内容区域 */}
          <div className={`transition-all duration-300 w-full`}>
            {/* 时间/配速等四个小模块 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">今日跑步</p>
                    <p className="text-2xl font-bold text-gray-900">5.2km</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">平均配速</p>
                    <p className="text-2xl font-bold text-gray-900">5'30"</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">运动时长</p>
                    <p className="text-2xl font-bold text-gray-900">32min</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              {/* 安全状态卡片已移除 */}
            </div>

            {/* 动态内容 */}
            {posts.length === 0 && !isLoading ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">欢迎来到跑步社区</h3>
                <p className="text-gray-500 mb-6">分享你的第一个跑步故事，开启社区之旅</p>
                <button
                  onClick={() => setIsCreatorOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-lg"
                >
                  发布第一条动态
                </button>
              </div>
            ) : (
              <>
                <WaterfallLayout
                  posts={posts}
                  onLike={handleToggleLike}
                  onBookmark={handleToggleBookmark}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  isLoading={isLoading}
                />

                {/* 加载更多 */}
                {hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="px-8 py-3 bg-white rounded-full border border-pink-200 text-pink-600 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {isLoading ? '加载中...' : '加载更多'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 历史对话面板已移除 */}
        </div>

        {/* 展开历史面板按钮已移除 */}
      </div>

      {/* 发布动态弹窗 */}
      {isCreatorOpen && (
        <PostCreator
          isOpen={isCreatorOpen}
          onClose={() => setIsCreatorOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </div>
  );
};

export default Community;