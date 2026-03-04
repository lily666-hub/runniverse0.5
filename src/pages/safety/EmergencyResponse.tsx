import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MapPin, Clock, Users, Shield, MessageSquare, Navigation, Battery, Signal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { useEmergency } from '../../hooks/useEmergency';

const EmergencyResponse: React.FC = () => {
  const { user } = useAuth();
  const { location: currentLocation, isTracking } = useLocationTracking();
  const {
    isEmergencyActive,
    activeEmergency,
    emergencyContacts,
    emergencyHistory,
    countdown,
    isLoading,
    error,
    triggerEmergency,
    cancelEmergency,
    resolveEmergency,
    addContact,
    removeContact,
    settings,
    updateSettings
  } = useEmergency();

  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: 'family' as 'family' | 'friend' | 'colleague' | 'emergency',
    priority: 1
  });

  // 附近的安全资源
  const nearbyResources = [
    { id: '1', name: '人民广场派出所', distance: '0.5km', type: 'police', phone: '021-12345678' },
    { id: '2', name: '瑞金医院', distance: '1.2km', type: 'hospital', phone: '021-87654321' },
    { id: '3', name: '24小时便利店', distance: '0.3km', type: 'safe_place', phone: '021-11223344' }
  ];

  const handleEmergencyTrigger = async (type: 'personal_safety' | 'medical' | 'harassment' | 'lost' | 'accident') => {
    await triggerEmergency(type);
  };

  const handleCancelEmergency = async () => {
    await cancelEmergency('用户主动取消');
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) return;
    
    await addContact({
      name: newContact.name,
      phone: newContact.phone,
      relationship: newContact.relationship,
      priority: newContact.priority,
      verified: false
    });
    
    setNewContact({ name: '', phone: '', relationship: 'family' as 'family' | 'friend' | 'colleague' | 'emergency', priority: 1 });
    setShowAddContact(false);
  };

  // 辅助函数
  const getEmergencyTypeText = (type: string) => {
    const typeMap = {
      'personal_safety': '个人安全',
      'medical': '医疗急救',
      'harassment': '骚扰求助',
      'lost': '迷路求助',
      'accident': '意外事故'
    };
    return typeMap[type] || type;
  };

  const getEmergencyTypeIcon = (type: string) => {
    const iconMap = {
      'personal_safety': '🛡️',
      'medical': '🚑',
      'harassment': '⚠️',
      'lost': '🧭',
      'accident': '🚨'
    };
    return iconMap[type] || '🚨';
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'active': '进行中',
      'resolved': '已解决',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 紧急状态提示 */}
        {isEmergencyActive && countdown > 0 && (
          <div className="bg-red-600 text-white rounded-lg p-6 shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 mr-3" />
                <div>
                  <h2 className="text-xl font-bold">紧急求救倒计时</h2>
                  <p className="text-red-100">
                    {countdown}秒后自动发送求救信号 - {getEmergencyTypeText(activeEmergency?.type)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelEmergency}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '取消中...' : '取消'}
                </button>
                <button
                  onClick={() => resolveEmergency('用户确认求救')}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '发送中...' : '立即求救'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 页面标题 */}
        <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="mr-3 h-8 w-8 text-red-600" />
                紧急响应中心
              </h1>
              <p className="text-gray-600 mt-2">
                24小时紧急救援服务，确保您的跑步安全
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">当前状态</div>
              <div className={`font-medium ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                {isTracking ? '位置追踪已开启' : '位置追踪未开启'}
              </div>
            </div>
          </div>
        </div>

        {/* 快速求救按钮 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
            快速求救
          </h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {isEmergencyActive ? (
            <div className="text-center">
              {countdown > 0 ? (
                <>
                  <div className="text-6xl font-bold text-red-500 mb-4">
                    {countdown}
                  </div>
                  <p className="text-gray-600 mb-4">
                    紧急求救将在 {countdown} 秒后自动发送
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    类型: {getEmergencyTypeText(activeEmergency?.type)}
                  </p>
                  <button
                    onClick={handleCancelEmergency}
                    disabled={isLoading}
                    className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '取消中...' : '取消求救'}
                  </button>
                </>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="text-red-600 text-lg font-semibold mb-2">
                    紧急求救已激活
                  </div>
                  <p className="text-gray-600 mb-4">
                    求救信号已发送，救援人员正在赶来
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => resolveEmergency('安全，已解决')}
                      disabled={isLoading}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '处理中...' : '我安全了'}
                    </button>
                    <button
                      onClick={handleCancelEmergency}
                      disabled={isLoading}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '取消中...' : '取消求救'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { type: 'medical', label: '医疗急救', color: 'bg-red-600 hover:bg-red-700' },
                  { type: 'harassment', label: '骚扰求助', color: 'bg-orange-600 hover:bg-orange-700' },
                  { type: 'accident', label: '意外事故', color: 'bg-yellow-600 hover:bg-yellow-700' },
                  { type: 'lost', label: '迷路求助', color: 'bg-blue-600 hover:bg-blue-700' }
                ].map((emergency) => (
                  <button
                    key={emergency.type}
                    onClick={() => handleEmergencyTrigger(emergency.type as 'personal_safety' | 'medical' | 'harassment' | 'lost' | 'accident')}
                    disabled={isLoading}
                    className={`${emergency.color} text-white p-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center`}
                  >
                    <div className="text-3xl mb-2">{getEmergencyTypeIcon(emergency.type)}</div>
                    <div className="font-medium">{emergency.label}</div>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>使用说明：</strong> 点击相应按钮后将有10秒倒计时，期间可以取消。倒计时结束后将自动发送求救信号给紧急联系人和附近的救援资源。
                </p>
              </div>
            </>
          )}
        </div>

        {/* 当前位置和状态 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-blue-600" />
            当前位置信息
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <Navigation className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">经纬度：</span>
                <span className="ml-2 font-mono text-sm">
                  {currentLocation ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` : '获取中...'}
                </span>
              </div>
              
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">更新时间：</span>
                <span className="ml-2 text-sm">
                  {currentLocation ? new Date(currentLocation.timestamp).toLocaleString() : '未知'}
                </span>
              </div>
              
              <div className="flex items-center">
                <Signal className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">精度：</span>
                <span className="ml-2 text-sm">
                  {currentLocation?.accuracy ? `±${currentLocation.accuracy.toFixed(0)}米` : '未知'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Battery className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">精度：</span>
                <span className="ml-2 text-sm">
                  {currentLocation?.accuracy ? `${currentLocation.accuracy.toFixed(1)}m` : '未知'}
                </span>
              </div>
              
              <div className="flex items-center">
                <Signal className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">速度：</span>
                <span className="ml-2 text-sm">
                  {currentLocation?.speed ? `${(currentLocation.speed * 3.6).toFixed(1)} km/h` : '静止'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 紧急联系人 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Phone className="mr-2 h-5 w-5 text-green-600" />
              紧急联系人
            </h2>
            <button 
              onClick={() => setShowAddContact(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              添加联系人
            </button>
          </div>
          
          <div className="space-y-3">
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{contact.name}</div>
                    <div className="text-sm text-gray-500">{contact.phone}</div>
                    <div className="text-xs text-gray-400">{contact.relationship}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    优先级 {contact.priority}
                  </span>
                  <button 
                    onClick={() => window.open(`tel:${contact.phone}`)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => removeContact(contact.id)}
                    disabled={isLoading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
            
            {emergencyContacts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无紧急联系人，请添加至少一个联系人
              </div>
            )}
          </div>
          
          {showAddContact && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="姓名"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="电话号码"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value as 'family' | 'friend' | 'colleague' | 'emergency' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="family">家人</option>
                  <option value="friend">朋友</option>
                  <option value="colleague">同事</option>
                  <option value="emergency">紧急联系人</option>
                </select>
                <select
                  value={newContact.priority}
                  onChange={(e) => setNewContact({ ...newContact, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>高优先级</option>
                  <option value={2}>中优先级</option>
                  <option value={3}>低优先级</option>
                </select>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAddContact}
                  disabled={isLoading || !newContact.name || !newContact.phone}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '添加中...' : '确认添加'}
                </button>
                <button
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 附近安全资源 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="mr-2 h-5 w-5 text-purple-600" />
            附近安全资源
          </h2>
          
          <div className="space-y-3">
            {nearbyResources.map((resource, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    {resource.type === 'police' && '👮'}
                    {resource.type === 'hospital' && '🏥'}
                    {resource.type === 'security' && '🛡️'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{resource.name}</div>
                    <div className="text-sm text-gray-500">距离 {resource.distance}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors">
                    导航
                  </button>
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Phone className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 紧急事件历史 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Clock className="mr-2 text-purple-500" />
            紧急事件历史
          </h2>
          
          <div className="space-y-3">
            {emergencyHistory.map((event) => (
              <div key={event.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-gray-800">
                    {getEmergencyTypeText(event.type)}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    event.status === 'resolved' ? 'bg-green-100 text-green-800' : 
                    event.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getStatusText(event.status)}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  {new Date(event.created_at).toLocaleString('zh-CN')}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {event.location ? `${event.location.latitude.toFixed(6)}, ${event.location.longitude.toFixed(6)}` : '位置未知'}
                </div>
                {event.description && (
                  <div className="text-sm text-gray-700">{event.description}</div>
                )}
                {event.resolution && (
                  <div className="text-sm text-green-700 mt-2">
                    解决方案: {event.resolution}
                  </div>
                )}
              </div>
            ))}
            
            {emergencyHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无紧急事件历史
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyResponse;