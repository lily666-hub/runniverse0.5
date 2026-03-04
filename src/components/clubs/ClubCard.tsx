import React from 'react';
import { Heart, Users, MessageSquare, Calendar, MapPin } from 'lucide-react';
import type { Club } from '../../types/club';

interface Props {
  club: Club;
  onLike?: (id: string) => void;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  onOpenDetail?: (id: string) => void;
}

const ClubCard: React.FC<Props> = ({ club, onLike, onJoin, onLeave, onOpenDetail }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden w-72 flex-shrink-0">
      {/* 封面图 */}
  <div className="relative w-full h-44 bg-gradient-to-br from-pink-100 to-rose-100 rounded-t-xl overflow-hidden">
    <img
      src={club.coverImage}
      alt={club.name}
      className="w-full h-full object-cover"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        // 使用跑步相关的默认图片
        target.src = 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=running%20club%20group%20shanghai%20city%20professional%20photo&image_size=landscape_4_3';
      }}
    />
        <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {club.tags.slice(0,2).join(' · ')}
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2 truncate">{club.name}</h3>
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <Users className="w-4 h-4 mr-1" />
          <span className="mr-3">{club.membersCount} 成员</span>
          {club.distanceKm !== undefined && (
            <>
              <MapPin className="w-4 h-4 mr-1" />
              <span>{club.distanceKm.toFixed(1)} km</span>
            </>
          )}
        </div>

        {/* 最新活动 */}
        {club.latestActivity && (
          <div className="bg-blue-50 rounded-lg p-2 text-sm text-blue-700 mb-3">
            <div className="flex items-center"><Calendar className="w-4 h-4 mr-1" />{new Date(club.latestActivity.time).toLocaleString()}</div>
            <div className="truncate">{club.latestActivity.title} · {club.latestActivity.location}</div>
          </div>
        )}

        {/* 操作区 */}
        <div className="flex items-center justify-between">
          <button onClick={() => onOpenDetail?.(club.id)} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">详情</button>
          <div className="flex items-center space-x-2">
            <button onClick={() => onLike?.(club.id)} className="inline-flex items-center px-2 py-1.5 text-sm rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100">
              <Heart className="w-4 h-4 mr-1" /> {club.likes}
            </button>
            <button onClick={() => onJoin?.(club.id)} className="px-2 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">加入</button>
          </div>
        </div>
      </div>

      {/* 简要信息 */}
      <div className="px-4 pb-4 text-xs text-gray-500">
        <div className="flex items-center"><MessageSquare className="w-3 h-3 mr-1" /> {club.commentsCount} 条评论</div>
        {club.latestActivity?.signupCount !== undefined && (
          <div className="flex items-center mt-1"><Users className="w-3 h-3 mr-1" /> {club.latestActivity.signupCount} 人已报名</div>
        )}
      </div>
    </div>
  );
};

export default ClubCard;