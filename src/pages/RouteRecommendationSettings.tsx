import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, MapPin, Shield, Bell, Brain, Sliders, Clock, Target } from 'lucide-react';
import { userPreferenceService } from '../services/userPreferenceService';
import { useAuth } from '../hooks/useAuth';
import type { UserPreference, RunningPreferences, SafetyPreferences, NotificationPreferences } from '../types/routeRecommendation';

const RouteRecommendationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreference | null>(null);

  // 表单状态
  const [runningPrefs, setRunningPrefs] = useState<RunningPreferences>({
    difficulty: ['medium'],
    preferredDistance: { min: 3, max: 10 },
    timeOfDay: ['morning'],
    routeTypes: ['park'],
    avoidTraffic: true,
    preferredWeather: ['sunny'],
    maxElevation: 100,
    preferredDifficulty: ['medium'],
    preferredTime: ['morning'],
    preferredEnvironment: ['park'],
    avoidTrafficRoads: true,
    preferScenicRoutes: true,
    fitnessLevel: 'intermediate'
  });

  const [safetyPrefs, setSafetyPrefs] = useState<SafetyPreferences>({
    nightRunning: false,
    buddySystem: false,
    emergencyContacts: false,
    safetyAlerts: true,
    avoidIsolatedAreas: true,
    avoidDarkAreas: true,
    preferWellLitRoutes: true,
    preferPopularRoutes: true,
    emergencyContactEnabled: true,
    shareLocationEnabled: false
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    aiRecommendations: true,
    weatherAlerts: true,
    routeUpdates: true,
    frequency: 'weekly',
    pushNotifications: true,
    quietHours: { start: '22:00', end: '07:00' },
    enableRecommendations: true,
    recommendationFrequency: 'weekly',
    enableWeatherAlerts: true,
    enableSafetyAlerts: true,
    enablePersonalizedTips: true
  });

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userPrefs = await userPreferenceService.getUserPreferences(user.id);
      
      if (userPrefs) {
        setPreferences({
          userId: user.id,
          runningPreferences: userPrefs.running || runningPrefs,
          safetyPreferences: userPrefs.safety || safetyPrefs,
          notificationPreferences: userPrefs.notification || notificationPrefs,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setRunningPrefs(userPrefs.running || {
          difficulty: ['medium'],
          preferredDistance: '5km',
          timeOfDay: ['morning'],
          routeTypes: ['park'],
          avoidTraffic: true,
          preferredWeather: ['sunny'],
          maxElevation: 100
        });
        setSafetyPrefs(userPrefs.safety || {
          nightRunning: false,
          buddySystem: false,
          emergencyContacts: false,
          safetyAlerts: true,
          avoidIsolatedAreas: true,
          avoidDarkAreas: true,
          preferWellLitRoutes: true,
          preferPopularRoutes: true,
          emergencyContactEnabled: false,
          shareLocationEnabled: false
        });
        setNotificationPrefs(userPrefs.notification || {
          aiRecommendations: true,
          routeUpdates: true,
          weatherAlerts: true,
          frequency: 'daily',
          pushNotifications: true,
          enableRecommendations: true,
          enableWeatherAlerts: true,
          enableSafetyAlerts: true,
          enablePersonalizedTips: true,
          recommendationFrequency: 'daily',
          quietHours: { start: '22:00', end: '07:00' }
        });
      }
    } catch (error) {
      console.error('加载用户偏好失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      const updatedPreferences: UserPreference = {
        userId: user.id,
        runningPreferences: runningPrefs,
        safetyPreferences: safetyPrefs,
        notificationPreferences: notificationPrefs,
        createdAt: preferences?.createdAt || new Date(),
        updatedAt: new Date()
      };

      await userPreferenceService.saveUserPreferences(user.id, updatedPreferences);
      setPreferences(updatedPreferences);
      
      // 显示成功提示
      alert('设置已保存！');
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载设置中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/routes')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <Brain className="w-6 h-6 text-purple-600 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">AI推荐设置</h1>
                  <p className="text-sm text-gray-600">个性化您的路线推荐体验</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              保存设置
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* 跑步偏好设置 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">跑步偏好</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 距离偏好 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  偏好距离范围 (公里)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={typeof runningPrefs.preferredDistance === 'string' ? '' : (runningPrefs.preferredDistance as any)?.min || ''}
                      onChange={(e) => setRunningPrefs(prev => ({
                        ...prev,
                        preferredDistance: typeof prev.preferredDistance === 'string' ? 
                          { min: Number(e.target.value), max: 10 } : 
                          { ...(prev.preferredDistance as any), min: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="最小距离"
                    />
                  </div>
                  <span className="text-gray-500">-</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={typeof runningPrefs.preferredDistance === 'string' ? '' : (runningPrefs.preferredDistance as any)?.max || ''}
                      onChange={(e) => setRunningPrefs(prev => ({
                        ...prev,
                        preferredDistance: typeof prev.preferredDistance === 'string' ? 
                          { min: 1, max: Number(e.target.value) } : 
                          { ...(prev.preferredDistance as any), max: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="最大距离"
                    />
                  </div>
                </div>
              </div>

              {/* 难度偏好 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  偏好难度
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'easy', label: '简单' },
                    { value: 'medium', label: '中等' },
                    { value: 'hard', label: '困难' }
                  ].map((difficulty) => (
                    <label key={difficulty.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={runningPrefs.preferredDifficulty?.includes(difficulty.value as any) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRunningPrefs(prev => ({
                              ...prev,
                              preferredDifficulty: [...(prev.preferredDifficulty || []), difficulty.value as any]
                            }));
                          } else {
                            setRunningPrefs(prev => ({
                              ...prev,
                              preferredDifficulty: (prev.preferredDifficulty || []).filter(d => d !== difficulty.value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{difficulty.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 时间偏好 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  偏好时间段
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'morning', label: '早晨 (6:00-10:00)' },
                    { value: 'afternoon', label: '下午 (14:00-18:00)' },
                    { value: 'evening', label: '傍晚 (18:00-21:00)' }
                  ].map((time) => (
                    <label key={time.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={runningPrefs.preferredTime?.includes(time.value as any) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRunningPrefs(prev => ({
                              ...prev,
                              preferredTime: [...(prev.preferredTime || []), time.value as any]
                            }));
                          } else {
                            setRunningPrefs(prev => ({
                              ...prev,
                              preferredTime: (prev.preferredTime || []).filter(t => t !== time.value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{time.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 环境偏好 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  偏好环境
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'park', label: '公园' },
                    { value: 'riverside', label: '河滨' },
                    { value: 'urban', label: '城市街道' },
                    { value: 'track', label: '跑道' }
                  ].map((env) => (
                    <label key={env.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={runningPrefs.preferredEnvironment?.includes(env.value as any) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRunningPrefs(prev => ({
                              ...prev,
                              preferredEnvironment: [...(prev.preferredEnvironment || []), env.value as any]
                            }));
                          } else {
                            setRunningPrefs(prev => ({
                              ...prev,
                              preferredEnvironment: (prev.preferredEnvironment || []).filter(e => e !== env.value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{env.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 其他偏好 */}
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={runningPrefs.avoidTrafficRoads}
                    onChange={(e) => setRunningPrefs(prev => ({ ...prev, avoidTrafficRoads: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">避开交通繁忙路段</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={runningPrefs.preferScenicRoutes}
                    onChange={(e) => setRunningPrefs(prev => ({ ...prev, preferScenicRoutes: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">偏好风景优美路线</span>
                </label>
              </div>

              {/* 健身水平 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  健身水平
                </label>
                <select
                  value={runningPrefs.fitnessLevel}
                  onChange={(e) => setRunningPrefs(prev => ({ ...prev, fitnessLevel: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">初学者</option>
                  <option value="intermediate">中级</option>
                  <option value="advanced">高级</option>
                </select>
              </div>
            </div>
          </div>

          {/* 安全偏好设置 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-green-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">安全偏好</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={safetyPrefs.avoidDarkAreas}
                    onChange={(e) => setSafetyPrefs(prev => ({ ...prev, avoidDarkAreas: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">避开昏暗区域</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={safetyPrefs.preferWellLitRoutes}
                    onChange={(e) => setSafetyPrefs(prev => ({ ...prev, preferWellLitRoutes: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">偏好照明良好的路线</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={safetyPrefs.avoidIsolatedAreas}
                    onChange={(e) => setSafetyPrefs(prev => ({ ...prev, avoidIsolatedAreas: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">避开偏僻区域</span>
                </label>
              </div>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={safetyPrefs.preferPopularRoutes}
                    onChange={(e) => setSafetyPrefs(prev => ({ ...prev, preferPopularRoutes: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">偏好热门路线</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={safetyPrefs.emergencyContactEnabled}
                    onChange={(e) => setSafetyPrefs(prev => ({ ...prev, emergencyContactEnabled: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">启用紧急联系人</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={safetyPrefs.shareLocationEnabled}
                    onChange={(e) => setSafetyPrefs(prev => ({ ...prev, shareLocationEnabled: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">允许位置共享</span>
                </label>
              </div>
            </div>
          </div>

          {/* 通知偏好设置 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Bell className="w-5 h-5 text-yellow-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">通知偏好</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.enableRecommendations}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, enableRecommendations: e.target.checked }))}
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">启用路线推荐通知</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.enableWeatherAlerts}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, enableWeatherAlerts: e.target.checked }))}
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">启用天气提醒</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.enableSafetyAlerts}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, enableSafetyAlerts: e.target.checked }))}
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">启用安全提醒</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.enablePersonalizedTips}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, enablePersonalizedTips: e.target.checked }))}
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">启用个性化建议</span>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    推荐频率
                  </label>
                  <select
                    value={notificationPrefs.recommendationFrequency}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, recommendationFrequency: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="daily">每日</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    免打扰时间
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={notificationPrefs.quietHours.start}
                      onChange={(e) => setNotificationPrefs(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, start: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={notificationPrefs.quietHours.end}
                      onChange={(e) => setNotificationPrefs(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, end: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteRecommendationSettings;