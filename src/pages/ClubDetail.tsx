import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Users, MessageSquare, Calendar, MapPin, ChevronLeft } from 'lucide-react';
import { clubService } from '../services/clubService';
import type { Club, ClubComment } from '../types/club';
import { useAuthStore } from '../store/authStore';

const LOCAL_KEY = 'club_state_v1';

const getJoinedMap = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed.joined || {};
  } catch {
    return {};
  }
};

const ClubDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [club, setClub] = useState<Club | null>(null);
  const [comments, setComments] = useState<ClubComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>(() => getJoinedMap());

  const isJoined = useMemo(() => (id ? !!joinedMap[id] : false), [joinedMap, id]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const c = await clubService.getClubById(id);
        setClub(c);
        const cs = await clubService.getComments(id);
        setComments(cs);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleLike = async () => {
    if (!id) return;
    await clubService.likeClub(id);
    // 简单刷新推荐数据以反映点赞（演示）
    const c = await clubService.getClubById(id);
    setClub(c);
  };

  const handleJoinOrLeave = async () => {
    if (!id) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (isJoined) {
      await clubService.leaveClub(id);
    } else {
      await clubService.joinClub(id);
    }
    setJoinedMap(getJoinedMap());
  };

  const handleAddComment = async () => {
    if (!id) return;
    const content = window.prompt('输入你的评论');
    if (!content || !content.trim()) return;
    await clubService.addComment({ clubId: id, userId: user?.id || 'guest', content });
    const cs = await clubService.getComments(id);
    setComments(cs);
  };

  const handleSignupActivity = async () => {
    // 演示：报名入口复用加入逻辑，实际应调用活动报名接口
    await handleJoinOrLeave();
    alert('报名成功（演示）');
  };

  if (loading || !club) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-600 mb-3">
          <ChevronLeft className="w-4 h-4 mr-1" /> 返回
        </button>
        <div className="bg-white rounded-xl shadow p-8 text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-600 mb-3">
        <ChevronLeft className="w-4 h-4 mr-1" /> 返回
      </button>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <img src={club.coverImage} alt={club.name} className="w-full h-64 object-cover" />
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{club.name}</h1>
          <p className="text-gray-600 mb-4">{club.description || '欢迎加入，一起跑步、一起成长！'}</p>

          <div className="flex items-center text-gray-700 space-x-4 mb-6">
            <div className="flex items-center"><Users className="w-4 h-4 mr-1" /> {club.membersCount} 成员</div>
            <div className="flex items-center"><Heart className="w-4 h-4 mr-1" /> {club.likes} 喜欢</div>
            <div className="flex items-center"><MessageSquare className="w-4 h-4 mr-1" /> {club.commentsCount + comments.length} 评论</div>
            {club.distanceKm !== undefined && (
              <div className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {club.distanceKm.toFixed(1)} km</div>
            )}
          </div>

          {club.latestActivity && (
            <div className="bg-blue-50 rounded-lg p-4 text-blue-800 mb-6">
              <div className="flex items-center mb-2"><Calendar className="w-4 h-4 mr-1" /> {new Date(club.latestActivity.time).toLocaleString()}</div>
              <div className="text-sm">{club.latestActivity.title} · {club.latestActivity.location}</div>
              <div className="mt-2 text-xs">已报名 {club.latestActivity.signupCount || 0} 人</div>
              <button onClick={handleSignupActivity} className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">报名活动</button>
            </div>
          )}

          <div className="flex items-center space-x-3 mb-6">
            <button onClick={handleLike} className="px-4 py-2 rounded-md bg-pink-50 text-pink-600 hover:bg-pink-100 inline-flex items-center">
              <Heart className="w-4 h-4 mr-1" /> 点赞
            </button>
            <button onClick={handleJoinOrLeave} className={`px-4 py-2 rounded-md ${isJoined ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {isJoined ? '退出社团' : '加入社团'}
            </button>
            <button onClick={handleAddComment} className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200">评论</button>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">最新评论</h2>
            {comments.length === 0 ? (
              <div className="text-sm text-gray-500">暂无评论</div>
            ) : (
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="border rounded-md p-3 text-sm">
                    <div className="text-gray-700">{c.content}</div>
                    <div className="text-xs text-gray-400 mt-1">用户 {c.userId} · {new Date(c.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;
