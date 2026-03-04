import React from 'react';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal } from 'lucide-react';

interface XiaohongshuCardProps {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    verified?: boolean;
  };
  content: {
    images: string[];
    text: string;
    location?: string;
    tags: string[];
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
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onMore?: (id: string) => void;
}

const XiaohongshuCard: React.FC<XiaohongshuCardProps> = ({
  id,
  user,
  content,
  stats,
  timestamp,
  isLiked = false,
  isBookmarked = false,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onMore
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      return '刚刚';
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}天前`;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* 用户信息 */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=default%20avatar%20icon%20professional%20photo&image_size=square';
              }}
            />
            {user.verified && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-medium text-gray-900">{user.name}</span>
              {user.verified && (
                <div className="w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{formatTime(timestamp)}</span>
              {content.location && (
                <>
                  <span>·</span>
                  <span>{content.location}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onMore?.(id)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* 图片轮播 */}
      {content.images.length > 0 && (
        <div className="relative">
          <div className="aspect-[3/4] bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
            <img
              src={content.images[0]}
              alt="跑步分享图片"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=running%20motivation%20poster%20professional%20photo&image_size=portrait_4_3';
              }}
            />
          </div>
          {content.images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              1/{content.images.length}
            </div>
          )}
        </div>
      )}

      {/* 内容文本 */}
      <div className="p-4">
        <div className="mb-3">
          <p className="text-gray-800 leading-relaxed line-clamp-3">
            {content.text}
          </p>
        </div>

        {/* 标签 */}
        {content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {content.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 互动按钮 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onLike?.(id)}
              className={`flex items-center space-x-1 ${isLiked ? 'text-pink-500' : 'text-gray-600'} hover:text-pink-500 transition-colors`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{formatNumber(stats.likes)}</span>
            </button>

            <button
              onClick={() => onComment?.(id)}
              className="flex items-center space-x-1 text-gray-600 hover:text-pink-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{formatNumber(stats.comments)}</span>
            </button>

            <button
              onClick={() => onShare?.(id)}
              className="flex items-center space-x-1 text-gray-600 hover:text-pink-500 transition-colors"
            >
              <Share className="w-5 h-5" />
              <span className="text-sm">{formatNumber(stats.shares)}</span>
            </button>
          </div>

          <button
            onClick={() => onBookmark?.(id)}
            className={`${isBookmarked ? 'text-pink-500' : 'text-gray-600'} hover:text-pink-500 transition-colors`}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default XiaohongshuCard;