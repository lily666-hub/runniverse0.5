import React, { useState, useEffect, useRef } from 'react';
import ImageCache from '../utils/imageCache';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  width,
  height,
  onLoad,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    if (imageRef && imageSrc === placeholder) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 如果已缓存为已加载，直接切换到原图
              if (ImageCache.has(src)) {
                setImageSrc(src);
                onLoad?.();
              } else {
                // 预加载图片
                const img = new Image();
                img.src = src;
                img.onload = () => {
                  ImageCache.markLoaded(src);
                  setImageSrc(src);
                  onLoad?.();
                };
                img.onerror = () => {
                  setImageSrc(placeholder);
                  onError?.();
                };
              }
              // 停止观察
              if (observer) {
                observer.disconnect();
              }
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );
      
      observer.observe(imageRef);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [imageRef, imageSrc, src, placeholder, onLoad, onError]);

  useEffect(() => {
    setImageRef(imgRef.current);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          imageSrc === placeholder ? 'opacity-50 lazy-image-placeholder' : 'opacity-100'
        }`}
        loading="lazy"
      />
      {imageSrc === placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full mb-2"></div>
            <div className="text-xs text-gray-500">加载中...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;