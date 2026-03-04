import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Share2, Download, Camera, Sparkles, Star, CheckCircle, Award, Heart, MessageSquare } from 'lucide-react';
import { RouteTask } from '../types/route';
import ShareUtils from '../utils/shareUtils';
import { getRouteImageById } from '../utils/imageResources';

const TaskCompletion: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'celebrating' | 'completed'>('entering');
  const [showShareCard, setShowShareCard] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // 获取任务和路线信息
  const task = location.state?.task || {
    id: '1',
    title: '江畔日出摄影',
    description: '在清晨6:30前到达外滩，拍摄一张日出时分的黄浦江照片',
    routeName: '外滩滨江步道',
    routeId: '1'
  };

  const completionMessage = location.state?.message || '恭喜完成探索！';

  // 统一图片来源：使用 imageResources 根据 routeId 获取同源图片
  const routeBgImage = getRouteImageById(task.routeId);

  useEffect(() => {
    // 动画序列
    const timer1 = setTimeout(() => {
      setAnimationPhase('celebrating');
    }, 800);

    const timer2 = setTimeout(() => {
      setAnimationPhase('completed');
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    
    try {
      const shareOptions = {
        title: `我在上海跑完成了"${task.title}"！`,
        description: customMessage || '用脚步丈量城市，用汗水记录美好时光。',
        image: routeBgImage,
        url: window.location.origin
      };

      // 模拟加载时间
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 根据平台执行不同的分享逻辑
      switch (platform) {
        case 'wechat':
          ShareUtils.shareToWeChat(shareOptions);
          break;
        case 'weibo':
          ShareUtils.shareToWeibo(shareOptions);
          break;
        case 'qq':
          ShareUtils.shareToQQ(shareOptions);
          break;
        case 'download':
          await downloadEnhancedShareCard();
          break;
      }
    } catch (error) {
      console.error('分享失败:', error);
      alert('分享失败，请重试');
    } finally {
      setIsSharing(false);
    }
  };

  const downloadEnhancedShareCard = async () => {
    try {
      const dataUrl = await ShareUtils.generateShareCard({
        title: '🎉 任务完成！',
        subtitle: `路线：${task.routeName}`,
        message: `${customMessage || '用脚步丈量城市，用汗水记录美好时光。'}\n\n任务：${task.title}`,
        backgroundImage: routeBgImage,
        logo: 'https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=跑'
      });
      
      ShareUtils.downloadImage(dataUrl, `上海跑-${task.title}-分享卡片.png`);
      alert('分享卡片已下载成功！');
    } catch (error) {
      console.error('生成分享卡片失败:', error);
      alert('生成分享卡片失败，请重试');
    }
  };

  const ShareCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 share-card">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">分享你的成就</h3>
          <p className="text-gray-600">让朋友们见证你的跑步成就</p>
        </div>

        {/* 分享卡片预览 */}
        <div className="share-card relative rounded-xl p-6 mb-6 text-white overflow-hidden">
          <img src={routeBgImage} alt="背景" className="absolute inset-0 w-full h-full object-cover opacity-70" />
          <div className="relative text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
            <h4 className="text-lg font-bold mb-2">🎉 任务完成！</h4>
            <p className="text-sm mb-2">路线：{task.routeName}</p>
            <p className="text-sm mb-3">任务：{task.title}</p>
            <p className="text-xs opacity-90">
              {customMessage || '用脚步丈量城市，用汗水记录美好时光。'}
            </p>
          </div>
        </div>

        {/* 个性化感言 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            个性化感言（可选）
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="分享你的跑步感受..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            maxLength={50}
          />
          <p className="text-xs text-gray-500 mt-1">{customMessage.length}/50</p>
        </div>

        {/* 分享按钮 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleShare('wechat')}
            disabled={isSharing}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            微信
          </button>
          <button
            onClick={() => handleShare('weibo')}
            disabled={isSharing}
            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            微博
          </button>
          <button
            onClick={() => handleShare('qq')}
            disabled={isSharing}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            <Heart className="w-4 h-4" />
            QQ空间
          </button>
          <button
            onClick={() => handleShare('download')}
            disabled={isSharing}
            className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            下载
          </button>
        </div>

        <button
          onClick={() => setShowShareCard(false)}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${animationPhase === 'entering' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* 顶部标题 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">任务完成</h1>
              <p className="text-gray-600 text-sm">{completionMessage}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowShareCard(true)}
                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleShare('download')}
                className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 背景图统一来源 */}
          <div className="relative h-40 rounded-xl overflow-hidden mb-6">
            <img src={routeBgImage} alt="路线背景" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            <div className="relative p-4">
              <div className="flex items-center gap-2 text-white">
                <Star className="w-5 h-5" />
                <span className="font-semibold">{task.routeName}</span>
              </div>
            </div>
          </div>

          {/* 任务信息 */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">任务：{task.title}</h2>
              <p className="text-gray-600 text-sm">{task.description}</p>
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors">
                <CheckCircle className="w-4 h-4" />
                记录完成
              </button>
              <button className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors">
                <Camera className="w-4 h-4" />
                上传照片
              </button>
            </div>
          </div>
        </div>

        {/* 分享卡片弹层 */}
        {showShareCard && <ShareCard />}
      </div>
    </div>
  );
};

export default TaskCompletion;