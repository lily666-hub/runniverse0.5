import React, { useState } from 'react';
import { Star, MessageSquare, Send, X } from 'lucide-react';

interface RouteFeedbackProps {
  routeId: string;
  routeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
}

export interface FeedbackData {
  routeId: string;
  rating: number;
  difficulty: number;
  safety: number;
  scenery: number;
  tags: string[];
  comment: string;
  wouldRecommend?: boolean; // 添加可选的wouldRecommend属性
}

const FEEDBACK_TAGS = [
  { id: 'scenic', label: '风景优美', category: 'positive' },
  { id: 'safe', label: '安全可靠', category: 'positive' },
  { id: 'challenging', label: '有挑战性', category: 'positive' },
  { id: 'well-maintained', label: '维护良好', category: 'positive' },
  { id: 'good-facilities', label: '设施完善', category: 'positive' },
  { id: 'quiet', label: '环境安静', category: 'positive' },
  { id: 'crowded', label: '人流较多', category: 'neutral' },
  { id: 'steep', label: '坡度较大', category: 'neutral' },
  { id: 'long-distance', label: '距离较长', category: 'neutral' },
  { id: 'poor-lighting', label: '照明不足', category: 'negative' },
  { id: 'uneven-surface', label: '路面不平', category: 'negative' },
  { id: 'traffic-noise', label: '交通噪音', category: 'negative' },
];

export const RouteFeedback: React.FC<RouteFeedbackProps> = ({
  routeId,
  routeName,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    routeId,
    rating: 0,
    difficulty: 0,
    safety: 0,
    scenery: 0,
    tags: [],
    comment: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRatingChange = (category: keyof FeedbackData, value: number) => {
    setFeedback(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setFeedback(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const handleSubmit = async () => {
    if (feedback.rating === 0) {
      alert('请为路线评分');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(feedback);
      onClose();
      // 重置表单
      setFeedback({
        routeId,
        rating: 0,
        difficulty: 0,
        safety: 0,
        scenery: 0,
        tags: [],
        comment: ''
      });
    } catch (error) {
      console.error('提交反馈失败:', error);
      alert('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    required: boolean = false
  ) => (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-0.5 sm:p-1 transition-colors ${
              star <= value
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <Star className="w-5 sm:w-6 h-5 sm:h-6 fill-current" />
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {value === 0 ? '请评分' : `${value} 星`}
      </p>
    </div>
  );

  const getTagColor = (category: string) => {
    switch (category) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">路线反馈</h2>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{routeName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 sm:w-5 h-4 sm:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* 总体评分 */}
          {renderStarRating(
            '总体评分',
            feedback.rating,
            (value) => handleRatingChange('rating', value),
            true
          )}

          {/* 详细评分 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {renderStarRating(
              '难度评价',
              feedback.difficulty,
              (value) => handleRatingChange('difficulty', value)
            )}
            {renderStarRating(
              '安全性',
              feedback.safety,
              (value) => handleRatingChange('safety', value)
            )}
            {renderStarRating(
              '风景评价',
              feedback.scenery,
              (value) => handleRatingChange('scenery', value)
            )}
          </div>



          {/* 标签选择 */}
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-xs sm:text-sm font-medium text-gray-700">
              路线特点标签 (可多选)
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {FEEDBACK_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border transition-colors ${
                    feedback.tags.includes(tag.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : getTagColor(tag.category)
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* 文字评价 */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700">
              详细评价 (可选)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />
              <textarea
                value={feedback.comment}
                onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="分享您的跑步体验，帮助其他跑者..."
                className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={3}
                maxLength={500}
              />
              <div className="absolute bottom-2 sm:bottom-3 right-3 text-xs text-gray-400">
                {feedback.comment.length}/500
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || feedback.rating === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            >
              {isSubmitting ? (
                <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3 sm:w-4 h-3 sm:h-4" />
              )}
              {isSubmitting ? '提交中...' : '提交反馈'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteFeedback;