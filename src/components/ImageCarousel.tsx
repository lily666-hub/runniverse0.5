import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Image as ImageIcon } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  autoPlayInterval?: number;
  height?: string;
  className?: string;
  fallbackImages?: string[];
  placeholderImages?: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  autoPlayInterval = 5000,
  height = '350px',
  className = '',
  fallbackImages = [],
  placeholderImages = []
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<number>>(new Set());
  const [retryCount, setRetryCount] = useState<Map<number, number>>(new Map());
  const [preloadStatus, setPreloadStatus] = useState<Map<number, 'loading' | 'success' | 'failed'>>(new Map());

  // 获取图片的实际路径 - 优化本地图片加载
  const getImagePath = useCallback((imagePath: string) => {
    // 如果是 data URI 或外部链接，直接返回
    if (imagePath.startsWith('data:') || imagePath.startsWith('http') || imagePath.startsWith('//')) {
      return imagePath;
    }
    
    // 确保路径以 / 开头
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    // 在开发环境中添加调试信息
    if (import.meta.env.DEV) {
      console.log(`[ImageCarousel] Loading image: ${normalizedPath}`);
    }
    
    return normalizedPath;
  }, []);

  // 图片预加载机制
  useEffect(() => {
    const preloadImages = async () => {
      if (import.meta.env.DEV) {
        console.log('[ImageCarousel] Starting image preload...');
      }
      
      // 预加载本地图片
      for (let i = 0; i < images.length; i++) {
        setPreloadStatus(prev => new Map(prev).set(i, 'loading'));
        
        try {
          const img = new Image();
          const imagePath = getImagePath(images[i]);
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              setPreloadStatus(prev => new Map(prev).set(i, 'success'));
              if (import.meta.env.DEV) {
                console.log(`[ImageCarousel] Preloaded image ${i}: ${imagePath}`);
              }
              resolve();
            };
            
            img.onerror = () => {
              setPreloadStatus(prev => new Map(prev).set(i, 'failed'));
              if (import.meta.env.DEV) {
                console.log(`[ImageCarousel] Failed to preload image ${i}: ${imagePath}`);
              }
              reject(new Error(`Failed to load ${imagePath}`));
            };
            
            img.src = imagePath;
          });
        } catch (error) {
          // 预加载失败，但不影响正常显示流程
          if (import.meta.env.DEV) {
            console.warn(`[ImageCarousel] Preload failed for image ${i}:`, error);
          }
        }
      }
    };

    preloadImages();
  }, [images, getImagePath]);

  // 自动轮播
  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [images.length, autoPlayInterval, isAutoPlaying]);

  // 上一张图片
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  // 下一张图片
  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // 跳转到指定图片
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // 鼠标悬停时暂停自动播放
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  // 鼠标离开时恢复自动播放
  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  // 处理图片加载错误

  // 处理图片加载开始
  const handleImageLoadStart = (index: number) => {
    setImageLoading(prev => new Set([...prev, index]));
  };

  // 处理图片加载成功
  const handleImageLoad = (index: number) => {
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setRetryCount(prev => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
  };

  // 获取当前应该显示的图片URL - 优先使用本地图片
  const getCurrentImageSrc = useCallback((index: number) => {
    const currentRetries = retryCount.get(index) || 0;
    
    // 第一次尝试：使用本地图片（优先级最高）
    if (currentRetries === 0) {
      const localImagePath = getImagePath(images[index]);
      if (import.meta.env.DEV) {
        console.log(`[ImageCarousel] Attempt ${currentRetries + 1}: Loading local image ${localImagePath}`);
      }
      return localImagePath;
    }
    
    // 第二次尝试：重试本地图片（添加缓存破坏参数）
    if (currentRetries === 1) {
      const localImagePath = getImagePath(images[index]) + `?retry=${Date.now()}`;
      if (import.meta.env.DEV) {
        console.log(`[ImageCarousel] Attempt ${currentRetries + 1}: Retrying local image ${localImagePath}`);
      }
      return localImagePath;
    }
    
    // 第三次及以后：使用备用图片
    if (fallbackImages.length > 0 && currentRetries >= 2) {
      const fallbackIndex = Math.min(currentRetries - 2, fallbackImages.length - 1);
      const fallbackPath = getImagePath(fallbackImages[fallbackIndex]);
      if (import.meta.env.DEV) {
        console.log(`[ImageCarousel] Attempt ${currentRetries + 1}: Using fallback image ${fallbackPath}`);
      }
      return fallbackPath;
    }
    
    // 最终备用：使用占位图片
    if (placeholderImages.length > 0) {
      const placeholderIndex = Math.min(index, placeholderImages.length - 1);
      const placeholderPath = placeholderImages[placeholderIndex];
      if (import.meta.env.DEV) {
        console.log(`[ImageCarousel] Using placeholder image for index ${index}`);
      }
      return placeholderPath;
    }
    
    // 最后的最后：重试本地图片
    return getImagePath(images[index]);
  }, [images, fallbackImages, placeholderImages, retryCount, getImagePath]);

  // 处理图片加载错误
  const handleImageError = (index: number) => {
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    
    const currentRetries = retryCount.get(index) || 0;
    // 增加重试次数：2次本地图片 + 备用图片数量 + 1次占位图片
    const maxRetries = 2 + fallbackImages.length + (placeholderImages.length > 0 ? 1 : 0);
    
    if (import.meta.env.DEV) {
      console.log(`[ImageCarousel] Image ${index} failed to load (attempt ${currentRetries + 1}/${maxRetries + 1})`);
    }
    
    if (currentRetries < maxRetries) {
      // 延迟重试，本地图片重试更快
      const retryDelay = currentRetries < 2 ? 300 : 800; // 本地图片重试更快
      setTimeout(() => {
        setRetryCount(prev => new Map(prev).set(index, currentRetries + 1));
        // 触发重新加载
        const img = document.querySelector(`img[data-carousel-index="${index}"]`) as HTMLImageElement;
        if (img) {
          const newSrc = getCurrentImageSrc(index);
          img.src = newSrc;
        }
      }, retryDelay);
    } else {
      if (import.meta.env.DEV) {
        console.log(`[ImageCarousel] All retry attempts failed for image ${index}`);
      }
      setImageErrors(prev => new Set([...prev, index]));
    }
  };

  // 手动重试加载图片
  const retryImage = (index: number) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setRetryCount(prev => new Map(prev).set(index, 0));
    handleImageLoadStart(index);
    
    // 重新加载图片
    const img = document.querySelector(`img[data-carousel-index="${index}"]`) as HTMLImageElement;
    if (img) {
      img.src = getCurrentImageSrc(index) + '?manual-retry=' + Date.now();
    }
  };

  if (images.length === 0) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-gray-500">暂无图片</p>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-lg shadow-lg ${className}`}
      style={{ height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 图片容器 */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {imageErrors.has(index) ? (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-600 p-6">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <div className="text-lg font-medium mb-2">本地图片加载失败</div>
                    <div className="text-sm text-gray-500 mb-2">
                      图片路径: {images[index]}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      重试次数: {retryCount.get(index) || 0}
                      {preloadStatus.get(index) && (
                        <span className="ml-2">
                          (预加载: {preloadStatus.get(index)})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => retryImage(index)}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重新加载本地图片
                    </button>
                  </div>
                </div>
            ) : imageLoading.has(index) ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <div className="text-sm">加载中...</div>
                </div>
              </div>
            ) : (
              <img
                  src={getCurrentImageSrc(index)}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover bg-gray-50"
                  data-carousel-index={index}
                  onLoadStart={() => handleImageLoadStart(index)}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
            )}
          </div>
        ))}
        
        {/* 渐变遮罩 - 增强文字可读性 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* 左右箭头 */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all duration-200 hover:scale-110 shadow-lg backdrop-blur-sm"
            aria-label="上一张图片"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all duration-200 hover:scale-110 shadow-lg backdrop-blur-sm"
            aria-label="下一张图片"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* 导航点 */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-white scale-110 shadow-lg'
                  : 'bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`跳转到第 ${index + 1} 张图片`}
            />
          ))}
        </div>
      )}

      {/* 图片计数器 */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;