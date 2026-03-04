// 简单图片缓存机制，避免重复加载导致的闪烁或黑图

const loadedImages = new Set<string>();

export const ImageCache = {
  has(url: string): boolean {
    return loadedImages.has(url);
  },
  markLoaded(url: string): void {
    loadedImages.add(url);
  }
};

export default ImageCache;