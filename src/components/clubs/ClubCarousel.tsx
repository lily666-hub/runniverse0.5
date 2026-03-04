import React, { useEffect, useRef } from 'react';
import type { Club } from '../../types/club';
import ClubCard from './ClubCard';

interface Props {
  clubs: Club[];
  onLike: (id: string) => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

const ClubCarousel: React.FC<Props> = ({ clubs, onLike, onJoin, onLeave, onOpenDetail }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // 可扩展：自动滚动或可视性提示
  }, []);

  return (
    <div className="relative">
      <div ref={containerRef} className="flex space-x-4 overflow-x-auto scrollbar-hide py-2">
        {clubs.map((club) => (
          <ClubCard
            key={club.id}
            club={club}
            onLike={onLike}
            onJoin={onJoin}
            onLeave={onLeave}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </div>
  );
};

export default ClubCarousel;