import React, { useEffect, useState } from 'react';
import { Sparkles, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { Club } from '../../types/club';
import { clubService } from '../../services/clubService';
import ClubCarousel from './ClubCarousel';

const ClubSidebarModule: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [sortBy, setSortBy] = useState<'heat' | 'distance' | 'activityTime'>('heat');

  useEffect(() => {
    const load = async () => {
      const res = await clubService.getRecommendedClubs({ sortBy, personalized: true, limit: 10 });
      setClubs(res);
    };
    load();
  }, [sortBy]);

  const handleLike = async (id: string) => {
    await clubService.likeClub(id);
    const res = await clubService.getRecommendedClubs({ sortBy, personalized: true, limit: 10 });
    setClubs(res);
  };

  const handleJoin = async (id: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    await clubService.joinClub(id);
  };

  const handleLeave = async (id: string) => {
    await clubService.leaveClub(id);
  };

  const handleOpenDetail = (id: string) => {
    navigate(`/club/${id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <h3 className="text-lg font-semibold text-gray-900">跑步社团推荐</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-sm border-gray-300 rounded-md"
          >
            <option value="heat">按热度</option>
            <option value="distance">按距离</option>
            <option value="activityTime">按活动时间</option>
          </select>
        </div>
      </div>

      <ClubCarousel
        clubs={clubs}
        onLike={handleLike}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onOpenDetail={handleOpenDetail}
      />
    </div>
  );
};

export default ClubSidebarModule;
       