import React, { useState } from 'react';
import { X, Image as ImageIcon, Loader2, Download } from 'lucide-react';
import type { AIMessage } from '../../types/ai';

interface ImagePreviewProps {
  images: AIMessage['images'];
  onRemove?: (imageId: string) => void;
  maxHeight?: number;
  showCaption?: boolean;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  onRemove,
  maxHeight = 200,
  showCaption = true,
  className = ''
}) => {
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const handleImageLoad = (imageId: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  };

  const handleImageError = (imageId: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
    setErrorImages(prev => new Set(prev).add(imageId));
  };

  const handleRemove = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(imageId);
  };

  const handleDownload = (image: AIMessage['images'][0], e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `image_${image.id}.${image.mimeType?.split('/')[1] || 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const renderSingleImage = (image: AIMessage['images'][0]) => (
    <div className="relative group">
      {loadingImages.has(image.id) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}
      
      {errorImages.has(image.id) ? (
        <div className="flex items-center justify-center w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">图片加载失败</p>
          </div>
        </div>
      ) : (
        <img
          src={image.url}
          alt={image.caption || '聊天图片'}
          className={`rounded-lg object-cover cursor-pointer transition-transform hover:scale-105 ${
            loadingImages.has(image.id) ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ maxHeight: `${maxHeight}px` }}
          onLoad={() => handleImageLoad(image.id)}
          onError={() => handleImageError(image.id)}
          onClick={() => handleImageClick(image.url)}
        />
      )}

      {/* 操作按钮 */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        {onRemove && (
          <button
            onClick={(e) => handleRemove(image.id, e)}
            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="删除图片"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => handleDownload(image, e)}
          className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          title="下载图片"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* 图片信息 */}
      {showCaption && (image.caption || image.size) && (
        <div className="mt-2 text-xs text-gray-600">
          {image.caption && <p className="mb-1">{image.caption}</p>}
          {image.size && (
            <div className="flex items-center space-x-2 text-gray-500">
              <span>{formatFileSize(image.size)}</span>
              {image.width && image.height && (
                <span>{image.width}×{image.height}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {images.length === 1 ? (
          renderSingleImage(images[0])
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images.map((image) => (
              <div key={image.id} className="relative">
                {renderSingleImage(image)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 图片预览模态框 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div className="relative max-w-full max-h-full p-4">
            <img
              src={selectedImage}
              alt="预览图片"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImagePreview;