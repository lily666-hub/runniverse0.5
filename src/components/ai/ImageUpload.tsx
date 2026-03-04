import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { imageUploadService } from '../../services/imageUploadService';
import type { ImageUploadResponse } from '../../types/ai';

interface ImageUploadProps {
  onImageUpload: (images: ImageUploadResponse[]) => void;
  maxSize?: number; // 默认5MB
  accept?: string; // 默认"image/*"
  multiple?: boolean; // 默认false
  compress?: boolean; // 默认true
  maxCount?: number; // 最大图片数量，默认5张
  conversationId?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = 'image/*',
  multiple = false,
  compress = true,
  maxCount = 5,
  conversationId,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<Array<{
    file: File;
    preview: string;
    id: string;
  }>>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const validateFiles = (files: File[]): { valid: boolean; error?: string } => {
    if (files.length === 0) {
      return { valid: false, error: '没有选择文件' };
    }

    if (!multiple && files.length > 1) {
      return { valid: false, error: '只能上传一张图片' };
    }

    if (multiple && files.length > maxCount) {
      return { valid: false, error: `最多只能上传${maxCount}张图片` };
    }

    // 检查每个文件
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return { valid: false, error: '只能上传图片文件' };
      }

      if (file.size > maxSize) {
        return { valid: false, error: `文件${file.name}超过最大限制${maxSize / (1024 * 1024)}MB` };
      }
    }

    return { valid: true };
  };

  const processFiles = async (files: File[]) => {
    const validation = validateFiles(files);
    if (!validation.valid) {
      setError(validation.error || '文件验证失败');
      return;
    }

    // 检查总文件大小
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = maxSize * maxCount;
    if (totalSize > maxTotalSize) {
      setError(`总文件大小不能超过 ${(maxTotalSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // 创建预览
      const newPreviews = files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9)
      }));

      setPreviewImages(prev => [...prev, ...newPreviews]);

      // 使用批量上传优化
      const uploadResults = await imageUploadService.uploadMultipleImages(
        files,
        {
          conversationId,
          compress,
          folder: 'chat-images',
          maxConcurrent: 3, // 限制并发数
        }
      );

      const successfulUploads = uploadResults.filter(result => result.success);
      const failedUploads = uploadResults.filter(result => !result.success);

      if (failedUploads.length > 0) {
        const errorMessage = failedUploads.map(fail => fail.error || '上传失败').join(', ');
        setError(`部分图片上传失败: ${errorMessage}`);
      }

      if (successfulUploads.length > 0) {
        onImageUpload(successfulUploads);
        
        // 清除已上传的预览
        const successfulIds = successfulUploads.map((_, index) => 
          newPreviews[index]?.id
        ).filter(Boolean);
        
        setPreviewImages(prev => 
          prev.filter(preview => !successfulIds.includes(preview.id))
        );
      }

      console.log(`📊 批量上传完成: ${successfulUploads.length}成功, ${failedUploads.length}失败`);
    } catch (error) {
      setError(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 拖拽事件处理
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // 文件选择处理
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    processFiles(files);
    
    // 清空input，允许重复选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 移除预览图片
  const removePreview = (id: string) => {
    setPreviewImages(prev => prev.filter(img => img.id !== id));
    // 释放URL对象
    const preview = previewImages.find(img => img.id === id);
    if (preview) {
      URL.revokeObjectURL(preview.preview);
    }
  };

  // 点击上传区域
  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 拖拽上传区域 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${
            isUploading
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }
        `}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
            <p className="text-sm text-gray-600">正在上传图片...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">
              {multiple 
                ? `拖拽图片到此处或点击上传（最多${maxCount}张）`
                : '拖拽图片到此处或点击上传'
              }
            </p>
            <p className="text-xs text-gray-500">
              支持 JPEG、PNG、WebP 格式，最大 {maxSize / (1024 * 1024)}MB
            </p>
          </div>
        )}
      </div>

      {/* 文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 图片预览 */}
      {previewImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">预览</h4>
          <div className={`
            grid gap-2
            ${previewImages.length === 1 ? 'grid-cols-1' : ''}
            ${previewImages.length === 2 ? 'grid-cols-2' : ''}
            ${previewImages.length >= 3 ? 'grid-cols-3' : ''}
          `}>
            {previewImages.map((preview) => (
              <div key={preview.id} className="relative group">
                <img
                  src={preview.preview}
                  alt="预览"
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePreview(preview.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;