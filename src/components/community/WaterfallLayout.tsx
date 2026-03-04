import React, { useState, useRef, useEffect } from 'react';
import XiaohongshuCard from './XiaohongshuCard';
import type { CommunityPost } from '../../types/community';

interface WaterfallLayoutProps {
  posts: CommunityPost[];
  columnCount?: number;
  gap?: number;
  onLike?: (postId: string) => void;
  onComment?: (post: CommunityPost) => void;
  onShare?: (post: CommunityPost) => void;
  onBookmark?: (postId: string) => void;
}

const WaterfallLayout: React.FC<WaterfallLayoutProps> = ({
  posts,
  columnCount = 2,
  gap = 16,
  onLike,
  onComment,
  onShare,
  onBookmark
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<CommunityPost[][]>([]);
  const [columnHeights, setColumnHeights] = useState<number[]>([]);

  useEffect(() => {
    distributeItems();
  }, [posts, columnCount]);

  const distributeItems = () => {
    const newColumns: CommunityPost[][] = Array.from({ length: columnCount }, () => []);
    const newHeights: number[] = Array.from({ length: columnCount }, () => 0);

    // 预估每个帖子的高度（基于图片和内容长度）
    const estimatedHeights = posts.map(post => {
      let baseHeight = 200; // 基础高度
      if (post.content.images.length > 0) baseHeight += 400; // 图片高度
      baseHeight += Math.min(post.content.text.length * 0.8, 200); // 文本高度
      baseHeight += post.content.tags.length * 25; // 标签高度
      return baseHeight;
    });

    posts.forEach((post, index) => {
      // 找到高度最小的列
      const minHeightIndex = newHeights.indexOf(Math.min(...newHeights));
      
      newColumns[minHeightIndex].push(post);
      newHeights[minHeightIndex] += estimatedHeights[index] + gap;
    });

    setColumns(newColumns);
    setColumnHeights(newHeights);
  };

  return (
    <div
      ref={containerRef}
      className="flex gap-4 px-4"
      style={{
        maxWidth: '100%',
        margin: '0 auto'
      }}
    >
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex-1 flex flex-col"
          style={{
            gap: `${gap}px`
          }}
        >
          {column.map((post) => (
            <div key={post.id}>
              <XiaohongshuCard
                id={post.id}
                user={post.user}
                content={post.content}
                stats={post.stats}
                timestamp={post.timestamp}
                isLiked={post.isLiked}
                isBookmarked={post.isBookmarked}
                onLike={onLike}
                onComment={() => onComment?.(post)}
                onShare={() => onShare?.(post)}
                onBookmark={onBookmark}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default WaterfallLayout;