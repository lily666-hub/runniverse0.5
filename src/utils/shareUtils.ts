/**
 * 社交分享工具
 * 支持微信、微博、QQ等主流社交平台
 */

interface ShareOptions {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export class ShareUtils {
  /**
   * 分享到微信
   */
  static shareToWeChat(options: ShareOptions): void {
    // 微信分享需要微信JS-SDK支持
    if (typeof window !== 'undefined' && (window as any).wx) {
      const wx = (window as any).wx;
      wx.ready(() => {
        wx.updateAppMessageShareData({
          title: options.title,
          desc: options.description,
          link: options.url || window.location.href,
          imgUrl: options.image || 'https://via.placeholder.com/300x300',
          success: () => {
            console.log('微信分享成功');
          },
          cancel: () => {
            console.log('用户取消分享');
          }
        });
      });
    } else {
      // 降级方案：复制分享链接
      this.copyToClipboard(`${options.title} - ${options.description}`);
      alert('分享链接已复制到剪贴板，请在微信中粘贴分享');
    }
  }

  /**
   * 分享到微博
   */
  static shareToWeibo(options: ShareOptions): void {
    const shareUrl = `https://service.weibo.com/share/share.php?` +
      `title=${encodeURIComponent(options.title + ' - ' + options.description)}&` +
      `url=${encodeURIComponent(options.url || window.location.href)}&` +
      `pic=${encodeURIComponent(options.image || '')}`;
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  /**
   * 分享到QQ空间
   */
  static shareToQQ(options: ShareOptions): void {
    const shareUrl = `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?` +
      `title=${encodeURIComponent(options.title)}&` +
      `desc=${encodeURIComponent(options.description)}&` +
      `url=${encodeURIComponent(options.url || window.location.href)}&` +
      `pics=${encodeURIComponent(options.image || '')}`;
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  /**
   * 生成分享卡片图片
   */
  static async generateShareCard(options: {
    title: string;
    subtitle: string;
    message: string;
    backgroundImage?: string;
    logo?: string;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 背景
      const gradient = ctx.createLinearGradient(0, 0, 800, 1200);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 1200);

      // 背景图片（如果有）
      if (options.backgroundImage) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = () => {
          // 直接绘制原图，不做虚化处理
          ctx.drawImage(bgImg, 0, 0, 800, 1200);
          // 适度暗化增强前景文字可读性
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, 800, 1200);
          ctx.globalAlpha = 1.0;
          drawContent();
        };
        bgImg.onerror = () => {
          drawContent();
        };
        bgImg.src = options.backgroundImage;
      } else {
        drawContent();
      }

      function drawContent() {
        // 标题
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(options.title, 400, 200);

        // 副标题
        ctx.font = 'bold 32px Arial';
        ctx.fillText(options.subtitle, 400, 280);

        // 消息
        ctx.font = '24px Arial';
        const lines = ShareUtils.wrapText(ctx, options.message, 700);
        lines.forEach((line, index) => {
          ctx.fillText(line, 400, 380 + index * 35);
        });

        // Logo（如果有）
        if (options.logo) {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          logoImg.onload = () => {
            const logoSize = 80;
            const logoX = (800 - logoSize) / 2;
            const logoY = 1000;
            
            // 绘制logo背景
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(logoX - 10, logoY - 10, logoSize + 20, logoSize + 20);
            
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            
            // 添加水印
            ctx.font = '16px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText('上海跑', 400, 1120);
            
            resolve(canvas.toDataURL('image/png'));
          };
          logoImg.onerror = () => {
            resolve(canvas.toDataURL('image/png'));
          };
          logoImg.src = options.logo;
        } else {
          // 添加水印
          ctx.font = '16px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillText('上海跑', 400, 1120);
          
          resolve(canvas.toDataURL('image/png'));
        }
      }
    });
  }

  /**
   * 文本换行
   */
  private static wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  /**
   * 复制到剪贴板
   */
  private static copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('复制失败:', err);
      }
      document.body.removeChild(textArea);
    }
  }

  /**
   * 下载图片
   */
  static downloadImage(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }
}

export default ShareUtils;