import { supabase } from '../lib/supabase';
import type { ImageUploadResponse } from '../types/ai';

export class ImageUploadService {
  private static instance: ImageUploadService;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_WIDTH = 1080;
  private readonly QUALITY = 0.8;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  /**
   * 压缩图片（智能压缩策略）
   */
  private async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('无法创建canvas上下文'));
            return;
          }

          // 智能尺寸计算
          let { width, height } = img;
          
          // 根据原图大小和质量要求调整压缩策略
          const fileSizeMB = file.size / (1024 * 1024);
          let targetQuality = this.QUALITY;
          
          if (fileSizeMB > 5) {
            targetQuality = Math.min(0.6, this.QUALITY); // 大文件降低质量
          } else if (fileSizeMB > 2) {
            targetQuality = Math.min(0.7, this.QUALITY); // 中等文件
          }
          
          // 计算目标尺寸
          if (width > this.MAX_WIDTH) {
            height = Math.round((height * this.MAX_WIDTH) / width);
            width = this.MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          // 高质量绘制设置
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 绘制压缩后的图片
          ctx.drawImage(img, 0, 0, width, height);

          // 转换为blob，使用更优的压缩参数
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`📸 图片压缩: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB (${Math.round((1 - blob.size / file.size) * 100)}%压缩)`);
                resolve(blob);
              } else {
                reject(new Error('图片压缩失败'));
              }
            },
            file.type,
            targetQuality
          );
        };

        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 验证文件
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: '不支持的文件类型' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: '文件大小不能超过10MB' };
    }

    return { isValid: true };
  }

  /**
   * 图片预处理（验证、压缩、优化）
   */
  private async preprocessImage(file: File, options: { compress?: boolean; maxWidth?: number; quality?: number } = {}): Promise<File> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // 如果不需要压缩或文件已经很小，直接返回
    if (!options.compress || file.size < 1024 * 1024) { // 小于1MB不压缩
      return file;
    }

    try {
      const compressedBlob = await this.compressImage(file);
      return new File([compressedBlob], file.name, { type: file.type });
    } catch (error) {
      console.warn('图片压缩失败，使用原文件:', error);
      return file;
    }
  }

  /**
   * 获取图片尺寸
   */
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error('无法获取图片尺寸'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 上传图片到Supabase
   */
  private async uploadToSupabase(
    file: File | Blob,
    fileName: string,
    folder: string = 'chat-images'
  ): Promise<{ data: any; error: any }> {
    const filePath = `${folder}/${fileName}`;
    
    return await supabase.storage
      .from('ai-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
  }

  /**
   * 生成唯一文件名
   */
  private generateFileName(originalName: string, conversationId?: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const prefix = conversationId ? `chat_${conversationId}` : 'image';
    
    return `${prefix}_${timestamp}_${randomStr}.${extension}`;
  }

  /**
   * 获取公共URL
   */
  private getPublicUrl(filePath: string): string {
    const { data } = supabase.storage.from('ai-images').getPublicUrl(filePath);
    return data.publicUrl;
  }

  /**
   * 上传单张图片
   */
  async uploadImage(
    file: File,
    options?: {
      conversationId?: string;
      compress?: boolean;
      folder?: string;
    }
  ): Promise<ImageUploadResponse> {
    try {
      // 验证文件
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          url: '',
          id: '',
          size: 0,
          mimeType: '',
          error: validation.error
        };
      }

      // 获取图片尺寸
      const dimensions = await this.getImageDimensions(file);

      // 压缩图片（如果需要）
      let processedFile: File | Blob = file;
      if (options?.compress !== false) {
        try {
          const compressedBlob = await this.compressImage(file);
          processedFile = new File([compressedBlob], file.name, { type: file.type });
        } catch (error) {
          console.warn('图片压缩失败，使用原图:', error);
          processedFile = file;
        }
      }

      // 生成文件名
      const fileName = this.generateFileName(file.name, options?.conversationId);

      // 上传到Supabase
      const { data, error } = await this.uploadToSupabase(
        processedFile,
        fileName,
        options?.folder
      );

      if (error) {
        throw new Error(`上传失败: ${error.message}`);
      }

      // 获取公共URL
      const publicUrl = this.getPublicUrl(data.path);

      return {
        success: true,
        url: publicUrl,
        id: data.id,
        size: processedFile.size,
        mimeType: file.type,
        width: dimensions.width,
        height: dimensions.height
      };
    } catch (error) {
      console.error('图片上传失败:', error);
      return {
        success: false,
        url: '',
        id: '',
        size: 0,
        mimeType: '',
        error: error instanceof Error ? error.message : '图片上传失败'
      };
    }
  }

  /**
   * 上传多张图片（批量上传）
   */
  async uploadMultipleImages(
    files: File[],
    options?: {
      conversationId?: string;
      compress?: boolean;
      folder?: string;
      maxConcurrent?: number;
    }
  ): Promise<ImageUploadResponse[]> {
    const { maxConcurrent = 3, ...uploadOptions } = options || {};
    const results: ImageUploadResponse[] = [];
    
    // 分批处理，限制并发数
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (file) => {
        try {
          const result = await this.uploadImage(file, uploadOptions);
          return result;
        } catch (error) {
          return {
            success: false,
            url: '',
            id: '',
            size: 0,
            mimeType: '',
            error: error instanceof Error ? error.message : '上传失败'
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      console.log(`🔄 批量上传进度: ${results.length}/${files.length}`);
    }
    
    return results;
  }

  /**
   * 删除图片
   */
  async deleteImage(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('ai-images')
        .remove([filePath]);

      if (error) {
        console.error('删除图片失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('删除图片失败:', error);
      return false;
    }
  }

  /**
   * 获取图片信息
   */
  async getImageInfo(filePath: string): Promise<any> {
    try {
      const { data, error } = await supabase.storage
        .from('ai-images')
        .list(filePath.split('/')[0], {
          search: filePath.split('/').pop()
        });

      if (error) {
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('获取图片信息失败:', error);
      return null;
    }
  }
}

export const imageUploadService = ImageUploadService.getInstance();