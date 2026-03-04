import React, { useState } from 'react';
import { Settings, Shield, Bell, MapPin, Users, Phone, Eye, Lock, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const SafetySettings: React.FC = () => {
  const { user } = useAuth();
  
  // 安全设置状态
  const [settings, setSettings] = useState({
    // 位置追踪设置
    locationTracking: {
      enabled: true,
      highAccuracy: true,
      backgroundTracking: false,
      shareWithContacts: true,
      trackingInterval: 30 // 秒
    },
    
    // 紧急响应设置
    emergency: {
      autoAlert: true,
      alertDelay: 10, // 秒
      includeLocation: true,
      includePhoto: false,
      includeAudio: true
    },
    
    // 通知设置
    notifications: {
      safetyAlerts: true,
      routeRecommendations: true,
      emergencyContacts: true,
      communityUpdates: false,
      weeklyReports: true
    },
    
    // 隐私设置
    privacy: {
      shareLocationWithBuddies: true,
      shareRunningHistory: false,
      allowContactFromStrangers: false,
      showOnlineStatus: true,
      dataRetention: 90 // 天
    },
    
    // 女性安全设置
    womenSafety: {
      enableWomenOnlyMode: false,
      femaleVerificationRequired: true,
      restrictedTimeSlots: true,
      safeZoneAlerts: true
    }
  });

  // 紧急联系人
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: '1', name: '家人', phone: '138****8888', relationship: 'family', priority: 1, verified: true },
    { id: '2', name: '朋友小李', phone: '139****9999', relationship: 'friend', priority: 2, verified: false }
  ]);

  // 安全区域
  const [safeZones, setSafeZones] = useState([
    { id: '1', name: '家', address: '上海市黄浦区南京东路123号', radius: 500, enabled: true },
    { id: '2', name: '公司', address: '上海市浦东新区陆家嘴环路456号', radius: 300, enabled: true }
  ]);

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    // 这里应该调用API保存设置
    console.log('保存设置:', settings);
    alert('设置已保存！');
  };

  const addEmergencyContact = () => {
    const newContact = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      relationship: 'friend',
      priority: emergencyContacts.length + 1,
      verified: false
    };
    setEmergencyContacts([...emergencyContacts, newContact]);
  };

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts(emergencyContacts.filter(contact => contact.id !== id));
  };

  const addSafeZone = () => {
    const newZone = {
      id: Date.now().toString(),
      name: '',
      address: '',
      radius: 500,
      enabled: true
    };
    setSafeZones([...safeZones, newZone]);
  };

  const removeSafeZone = (id: string) => {
    setSafeZones(safeZones.filter(zone => zone.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="mr-3 h-8 w-8 text-blue-600" />
                安全设置
              </h1>
              <p className="text-gray-600 mt-2">
                配置您的安全偏好和隐私设置，确保最佳的跑步安全体验
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="mr-2 h-5 w-5" />
              保存设置
            </button>
          </div>
        </div>

        {/* 位置追踪设置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-green-600" />
            位置追踪设置
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">启用位置追踪</label>
                <p className="text-sm text-gray-600">允许应用追踪您的实时位置以提供安全服务</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.locationTracking.enabled}
                  onChange={(e) => handleSettingChange('locationTracking', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">高精度定位</label>
                <p className="text-sm text-gray-600">使用GPS获取更精确的位置信息（耗电量较高）</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.locationTracking.highAccuracy}
                  onChange={(e) => handleSettingChange('locationTracking', 'highAccuracy', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">后台追踪</label>
                <p className="text-sm text-gray-600">即使应用在后台也继续追踪位置</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.locationTracking.backgroundTracking}
                  onChange={(e) => handleSettingChange('locationTracking', 'backgroundTracking', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block font-medium text-gray-900 mb-2">追踪间隔</label>
              <select
                value={settings.locationTracking.trackingInterval}
                onChange={(e) => handleSettingChange('locationTracking', 'trackingInterval', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10秒（高频率）</option>
                <option value={30}>30秒（推荐）</option>
                <option value={60}>1分钟（省电）</option>
                <option value={300}>5分钟（低频率）</option>
              </select>
            </div>
          </div>
        </div>

        {/* 紧急响应设置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
            紧急响应设置
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">自动报警</label>
                <p className="text-sm text-gray-600">检测到异常情况时自动发送求救信号</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emergency.autoAlert}
                  onChange={(e) => handleSettingChange('emergency', 'autoAlert', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block font-medium text-gray-900 mb-2">报警延迟</label>
              <select
                value={settings.emergency.alertDelay}
                onChange={(e) => handleSettingChange('emergency', 'alertDelay', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value={0}>立即发送</option>
                <option value={5}>5秒延迟</option>
                <option value={10}>10秒延迟</option>
                <option value={30}>30秒延迟</option>
              </select>
              <p className="text-sm text-gray-600 mt-1">延迟期间可以取消误报</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">包含位置信息</label>
                <p className="text-sm text-gray-600">在求救信号中包含当前位置</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emergency.includeLocation}
                  onChange={(e) => handleSettingChange('emergency', 'includeLocation', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">包含音频录制</label>
                <p className="text-sm text-gray-600">自动录制周围环境音频作为证据</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emergency.includeAudio}
                  onChange={(e) => handleSettingChange('emergency', 'includeAudio', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 通知设置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="mr-2 h-5 w-5 text-yellow-600" />
            通知设置
          </h2>
          
          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">
                    {key === 'safetyAlerts' && '安全警报'}
                    {key === 'routeRecommendations' && '路线推荐'}
                    {key === 'emergencyContacts' && '紧急联系人通知'}
                    {key === 'communityUpdates' && '社区动态'}
                    {key === 'weeklyReports' && '周报'}
                  </label>
                  <p className="text-sm text-gray-600">
                    {key === 'safetyAlerts' && '接收安全相关的重要警报'}
                    {key === 'routeRecommendations' && '接收个性化路线推荐'}
                    {key === 'emergencyContacts' && '紧急情况时通知联系人'}
                    {key === 'communityUpdates' && '接收社区活动和更新'}
                    {key === 'weeklyReports' && '接收每周安全报告'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 隐私设置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Lock className="mr-2 h-5 w-5 text-purple-600" />
            隐私设置
          </h2>
          
          <div className="space-y-4">
            {Object.entries(settings.privacy).map(([key, value]) => {
              if (key === 'dataRetention') {
                return (
                  <div key={key}>
                    <label className="block font-medium text-gray-900 mb-2">数据保留期限</label>
                    <select
                      value={value as number}
                      onChange={(e) => handleSettingChange('privacy', key, parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={30}>30天</option>
                      <option value={90}>90天</option>
                      <option value={180}>180天</option>
                      <option value={365}>1年</option>
                    </select>
                    <p className="text-sm text-gray-600 mt-1">超过期限的数据将被自动删除</p>
                  </div>
                );
              }
              
              return (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900">
                      {key === 'shareLocationWithBuddies' && '与跑友分享位置'}
                      {key === 'shareRunningHistory' && '分享跑步历史'}
                      {key === 'allowContactFromStrangers' && '允许陌生人联系'}
                      {key === 'showOnlineStatus' && '显示在线状态'}
                    </label>
                    <p className="text-sm text-gray-600">
                      {key === 'shareLocationWithBuddies' && '允许已确认的跑友查看您的实时位置'}
                      {key === 'shareRunningHistory' && '在社区中分享您的跑步记录'}
                      {key === 'allowContactFromStrangers' && '允许未添加的用户向您发送消息'}
                      {key === 'showOnlineStatus' && '让其他用户看到您的在线状态'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => handleSettingChange('privacy', key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* 紧急联系人管理 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Phone className="mr-2 h-5 w-5 text-green-600" />
              紧急联系人
            </h2>
            <button
              onClick={addEmergencyContact}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              添加联系人
            </button>
          </div>
          
          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <div key={contact.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="姓名"
                    value={contact.name}
                    onChange={(e) => {
                      const updated = emergencyContacts.map(c => 
                        c.id === contact.id ? { ...c, name: e.target.value } : c
                      );
                      setEmergencyContacts(updated);
                    }}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="tel"
                    placeholder="电话号码"
                    value={contact.phone}
                    onChange={(e) => {
                      const updated = emergencyContacts.map(c => 
                        c.id === contact.id ? { ...c, phone: e.target.value } : c
                      );
                      setEmergencyContacts(updated);
                    }}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <select
                    value={contact.relationship}
                    onChange={(e) => {
                      const updated = emergencyContacts.map(c => 
                        c.id === contact.id ? { ...c, relationship: e.target.value } : c
                      );
                      setEmergencyContacts(updated);
                    }}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="family">家人</option>
                    <option value="friend">朋友</option>
                    <option value="colleague">同事</option>
                    <option value="emergency">紧急服务</option>
                  </select>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${contact.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {contact.verified ? '已验证' : '未验证'}
                    </span>
                    <button
                      onClick={() => removeEmergencyContact(contact.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 女性安全设置 */}
        {user?.gender === 'female' && (
          <div className="bg-white rounded-lg border border-pink-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="mr-2 h-5 w-5 text-pink-600" />
              女性安全设置
            </h2>
            
            <div className="space-y-4">
              {Object.entries(settings.womenSafety).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900">
                      {key === 'enableWomenOnlyMode' && '启用女性专用模式'}
                      {key === 'femaleVerificationRequired' && '要求女性身份验证'}
                      {key === 'restrictedTimeSlots' && '限制时段提醒'}
                      {key === 'safeZoneAlerts' && '安全区域警报'}
                    </label>
                    <p className="text-sm text-gray-600">
                      {key === 'enableWomenOnlyMode' && '只与已验证的女性用户互动'}
                      {key === 'femaleVerificationRequired' && '要求其他女性用户完成身份验证'}
                      {key === 'restrictedTimeSlots' && '在不安全时段发送提醒'}
                      {key === 'safeZoneAlerts' && '离开安全区域时发送警报'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleSettingChange('womenSafety', key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafetySettings;