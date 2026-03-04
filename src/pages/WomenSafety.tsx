import React, { useState, useEffect, useRef } from 'react';
import { Shield, Users, Phone, MapPin, Clock, Heart, Star, AlertTriangle, MessageCircle, Bot, Navigation, Target, PhoneCall, Send, Plus, Edit, Trash2 } from 'lucide-react';
import { WomenSafetyAdvisor } from '../components/ai';
import { IntelligentRunningMap } from '../components/map/IntelligentRunningMap';

interface SafetyFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
}

interface SafeZone {
  id: string;
  name: string;
  address: string;
  distance: number;
  safetyRating: number;
  features: string[];
  openHours: string;
}

interface RunningBuddy {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  distance: number;
  preferredTime: string;
  isOnline: boolean;
  verificationStatus: 'verified' | 'pending' | 'none';
}

interface SafetyTip {
  id: string;
  category: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isDefault?: boolean;
}

interface EmergencyService {
  id: string;
  name: string;
  phone: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const WomenSafety: React.FC = () => {
  const [activeFeatures, setActiveFeatures] = useState<string[]>(['buddy-system', 'safe-zones', 'real-time-tracking', 'safe-route-planning']);
  const [selectedTab, setSelectedTab] = useState<'features' | 'zones' | 'buddies' | 'emergency-contacts' | 'ai-advisor' | 'safe-routes'>('features');

  // 地图相关状态
  const mapRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [waypoints, setWaypoints] = useState<Array<{ lat: number; lng: number; name?: string }>>([]);
  const [safetyRoute, setSafetyRoute] = useState<any>(null);

  // 紧急联系人状态
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: '1', name: '妈妈', phone: '138****1234', relationship: '家人' },
    { id: '2', name: '闺蜜小雨', phone: '139****5678', relationship: '朋友' },
  ]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });

  // 地图事件处理函数
  const handleRouteGenerated = (route: any) => {
    console.log('安全路线已生成:', route);
    setSafetyRoute(route);
  };

  const handleWaypointAdded = (waypoint: any) => {
    console.log('途经点已添加:', waypoint);
    setWaypoints(prev => [...prev, waypoint]);
  };

  const handleWaypointRemoved = (waypointId: string) => {
    console.log('途经点已移除:', waypointId);
    setWaypoints(prev => prev.filter(wp => wp.name !== waypointId));
  };

  const handleMapError = (error: any) => {
    console.error('地图错误:', error);
    setMapError(error.message || '地图加载失败');
  };

  // 生成安全路线
  const generateSafeRoute = () => {
    if (mapRef.current) {
      mapRef.current.generateRoute?.();
    }
  };

  // 清除路线
  const clearRoute = () => {
    if (mapRef.current) {
      mapRef.current.clearRoute?.();
    }
    setSafetyRoute(null);
    setWaypoints([]);
  };

  // 紧急服务数据
  const emergencyServices: EmergencyService[] = [
    {
      id: 'police',
      name: '报警电话',
      phone: '110',
      description: '遇到危险或犯罪行为时拨打',
      icon: <Shield className="w-8 h-8" />,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'medical',
      name: '急救电话',
      phone: '120',
      description: '医疗急救和健康紧急情况',
      icon: <Heart className="w-8 h-8" />,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'fire',
      name: '消防电话',
      phone: '119',
      description: '火灾、救援等紧急情况',
      icon: <AlertTriangle className="w-8 h-8" />,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  // 紧急联系人相关函数
  const handleEmergencyCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleSendLocation = async (contactId: string) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationMessage = `紧急情况！我的当前位置：https://maps.google.com/?q=${latitude},${longitude}`;
          // 这里可以集成短信API或其他通信方式
          alert(`位置信息已准备发送：${locationMessage}`);
        },
        (error) => {
          alert('无法获取位置信息，请检查定位权限');
        }
      );
    } else {
      alert('您的浏览器不支持定位功能');
    }
  };

  const addEmergencyContact = () => {
    if (newContact.name && newContact.phone && newContact.relationship) {
      const contact: EmergencyContact = {
        id: Date.now().toString(),
        ...newContact
      };
      setEmergencyContacts(prev => [...prev, contact]);
      setNewContact({ name: '', phone: '', relationship: '' });
      setShowAddContact(false);
    }
  };

  const removeEmergencyContact = (contactId: string) => {
    setEmergencyContacts(prev => prev.filter(contact => contact.id !== contactId));
  };

  const safetyFeatures: SafetyFeature[] = [
    {
      id: 'buddy-system',
      title: '跑步伙伴系统',
      description: '与附近的女性跑者结伴，确保跑步安全',
      icon: <Users className="w-6 h-6" />,
      isActive: activeFeatures.includes('buddy-system')
    },
    {
      id: 'safe-zones',
      title: '安全区域推荐',
      description: '为女性跑者推荐安全的跑步区域和路线',
      icon: <Shield className="w-6 h-6" />,
      isActive: activeFeatures.includes('safe-zones')
    },
    {
      id: 'real-time-tracking',
      title: '实时位置共享',
      description: '与信任的联系人实时共享跑步位置',
      icon: <MapPin className="w-6 h-6" />,
      isActive: activeFeatures.includes('real-time-tracking')
    },
    {
      id: 'safe-route-planning',
      title: '安全路线规划',
      description: '基于安全评分的智能路线规划和避险导航',
      icon: <Navigation className="w-6 h-6" />,
      isActive: activeFeatures.includes('safe-route-planning')
    }
  ];

  const safeZones: SafeZone[] = [
    {
      id: '1',
      name: '世纪公园女性专用跑道',
      address: '浦东新区锦绣路1001号',
      distance: 0.8,
      safetyRating: 95,
      features: ['24小时监控', '专用照明', '紧急呼叫点', '女性更衣室'],
      openHours: '05:00-22:00'
    },
    {
      id: '2',
      name: '静安雕塑公园安全区',
      address: '静安区石门二路128号',
      distance: 1.2,
      safetyRating: 92,
      features: ['安保巡逻', '充足照明', '人流密集', '医疗点'],
      openHours: '06:00-21:00'
    },
    {
      id: '3',
      name: '外滩滨江女性友好步道',
      address: '黄浦区中山东一路',
      distance: 2.1,
      safetyRating: 88,
      features: ['景观优美', '人流适中', '紧急设施', '休息区'],
      openHours: '全天开放'
    }
  ];

  const runningBuddies: RunningBuddy[] = [
    {
      id: '1',
      name: '小雨',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=young_asian_woman_runner_profile_photo_friendly_smile&image_size=square',
      rating: 4.9,
      distance: 0.5,
      preferredTime: '07:00-08:00',
      isOnline: true,
      verificationStatus: 'verified'
    },
    {
      id: '2',
      name: '晓梅',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=asian_woman_runner_profile_athletic_confident&image_size=square',
      rating: 4.8,
      distance: 0.8,
      preferredTime: '18:30-19:30',
      isOnline: true,
      verificationStatus: 'verified'
    },
    {
      id: '3',
      name: '丽丽',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=young_woman_runner_profile_sporty_cheerful&image_size=square',
      rating: 4.7,
      distance: 1.2,
      preferredTime: '06:30-07:30',
      isOnline: false,
      verificationStatus: 'verified'
    }
  ];

  const safetyTips: SafetyTip[] = [
    {
      id: '1',
      category: '跑步装备',
      title: '选择合适的跑步装备',
      content: '穿着反光材料的运动服，携带哨子和手机，确保在紧急情况下能够求助。',
      priority: 'high'
    },
    {
      id: '2',
      category: '路线规划',
      title: '选择安全的跑步路线',
      content: '避免偏僻路段，选择人流适中、照明良好的区域，提前了解路线上的安全设施。',
      priority: 'high'
    },
    {
      id: '3',
      category: '时间安排',
      title: '合理安排跑步时间',
      content: '尽量在白天或傍晚人流较多的时段跑步，避免深夜独自外出。',
      priority: 'medium'
    },
    {
      id: '4',
      category: '社交安全',
      title: '与跑步伙伴保持联系',
      content: '定期与跑步伙伴或家人报告位置，建立定时联系机制。',
      priority: 'medium'
    }
  ];

  const toggleFeature = (featureId: string) => {
    setActiveFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>;
      case 'pending':
        return <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-blue-300 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <Heart className="w-8 h-8 mr-3 text-pink-600" />
            女性专属安全保障
          </h1>
          <p className="text-gray-600">专为女性跑者设计的全方位安全保护系统</p>
        </div>

        {/* 导航标签 */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'features', label: '安全功能', icon: Shield },
              { key: 'zones', label: '安全区域', icon: MapPin },
              { key: 'buddies', label: '跑步伙伴', icon: Users },
              { key: 'safe-routes', label: '安全路线', icon: Navigation },
              { key: 'emergency-contacts', label: '紧急联系人', icon: Phone },
              { key: 'ai-advisor', label: '路线小助手', icon: Bot }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedTab(key as any)}
                className={`flex-1 flex items-center justify-center py-4 px-6 font-medium transition-colors ${
                  selectedTab === key
                    ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 安全功能标签页 */}
        {selectedTab === 'features' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safetyFeatures.map((feature) => (
              <div
                key={feature.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all cursor-pointer ${
                  feature.isActive 
                    ? 'border-pink-300 bg-pink-50' 
                    : 'border-gray-200 hover:border-pink-200'
                }`}
                onClick={() => toggleFeature(feature.id)}
              >
                <div className="flex items-start">
                  <div className={`p-3 rounded-lg mr-4 ${
                    feature.isActive ? 'bg-pink-200 text-pink-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 mb-3">{feature.description}</p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      feature.isActive 
                        ? 'bg-pink-200 text-pink-800' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {feature.isActive ? '已启用' : '点击启用'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 安全区域标签页 */}
        {selectedTab === 'zones' && (
          <div className="space-y-6">
            {safeZones.map((zone) => (
              <div key={zone.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">{zone.name}</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="mr-4">{zone.address}</span>
                      <span className="text-sm">距离 {zone.distance} km</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-gray-500" />
                      <span className="text-sm text-gray-600">{zone.openHours}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 mb-1">{zone.safetyRating}</div>
                    <div className="text-sm text-gray-600">安全评分</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {zone.features.map((feature, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 跑步伙伴标签页 */}
        {selectedTab === 'buddies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runningBuddies.map((buddy) => (
              <div key={buddy.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={buddy.avatar}
                    alt={buddy.name}
                    className="w-12 h-12 rounded-full object-cover mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-semibold text-gray-800 mr-2">{buddy.name}</h3>
                      {getVerificationBadge(buddy.verificationStatus)}
                    </div>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-600">{buddy.rating}</span>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${buddy.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>距离 {buddy.distance} km</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>偏好时间: {buddy.preferredTime}</span>
                  </div>
                </div>
                
                <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  发送邀请
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 安全路线标签页 */}
        {selectedTab === 'safe-routes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧控制面板 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 路线控制 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Navigation className="mr-2 text-pink-500" />
                  安全路线规划
                </h3>
                
                <div className="space-y-4">
                  <button
                    onClick={generateSafeRoute}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Target className="w-5 h-5 mr-2" />
                    生成安全路线
                  </button>
                  
                  <button
                    onClick={clearRoute}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    清除路线
                  </button>
                </div>

                {mapError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{mapError}</p>
                  </div>
                )}
              </div>

              {/* 途经点列表 */}
              {waypoints.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">途经点</h4>
                  <div className="space-y-2">
                    {waypoints.map((waypoint, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          {waypoint.name || `点 ${index + 1}`}
                        </span>
                        <button
                          onClick={() => handleWaypointRemoved(waypoint.name || `waypoint_${index}`)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 路线信息 */}
              {safetyRoute && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">路线信息</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">距离:</span>
                      <span className="font-medium">{safetyRoute.distance || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">安全评分:</span>
                      <span className="font-medium text-green-600">{safetyRoute.safetyScore || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">预计用时:</span>
                      <span className="font-medium">{safetyRoute.duration || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧地图区域 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <IntelligentRunningMap
                  ref={mapRef}
                  mode="planning"
                  initialCenter={[121.4737, 31.2304]}
                  initialZoom={13}
                  width="100%"
                  height="600px"
                  onRouteGenerated={handleRouteGenerated}
                  onWaypointAdded={handleWaypointAdded}
                  onWaypointRemoved={handleWaypointRemoved}
                  onError={handleMapError}
                />
              </div>
            </div>
          </div>
        )}

        {/* 紧急联系人标签页 */}
        {selectedTab === 'emergency-contacts' && (
          <div className="space-y-6">
            {/* 紧急服务 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <PhoneCall className="mr-2 text-red-500" />
                紧急服务电话
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {emergencyServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleEmergencyCall(service.phone)}
                    className={`${service.color} text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg`}
                  >
                    <div className="flex flex-col items-center text-center">
                      {service.icon}
                      <h4 className="text-lg font-bold mt-2">{service.name}</h4>
                      <p className="text-2xl font-bold mt-1">{service.phone}</p>
                      <p className="text-sm mt-2 opacity-90">{service.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 个人紧急联系人 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Phone className="mr-2 text-pink-500" />
                  个人紧急联系人
                </h3>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加联系人
                </button>
              </div>

              {/* 联系人列表 */}
              <div className="space-y-3">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{contact.name}</h4>
                      <p className="text-gray-600 text-sm">{contact.relationship}</p>
                      <p className="text-gray-500 text-sm">{contact.phone}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEmergencyCall(contact.phone)}
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                        title="拨打电话"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendLocation(contact.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                        title="发送位置"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeEmergencyContact(contact.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                        title="删除联系人"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 添加联系人表单 */}
              {showAddContact && (
                <div className="mt-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
                  <h4 className="font-semibold text-gray-800 mb-3">添加新的紧急联系人</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="姓名"
                      value={newContact.name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <input
                      type="tel"
                      placeholder="电话号码"
                      value={newContact.phone}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <select
                      value={newContact.relationship}
                      onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="">选择关系</option>
                      <option value="家人">家人</option>
                      <option value="朋友">朋友</option>
                      <option value="同事">同事</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div className="flex space-x-3 mt-3">
                    <button
                      onClick={addEmergencyContact}
                      className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      确认添加
                    </button>
                    <button
                      onClick={() => {
                        setShowAddContact(false);
                        setNewContact({ name: '', phone: '', relationship: '' });
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 快捷操作提示 */}
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <AlertTriangle className="mr-2 text-orange-500" />
                紧急情况快捷操作
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong>一键拨打：</strong>点击紧急服务电话或联系人的电话按钮，立即拨打电话
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong>发送位置：</strong>点击发送位置按钮，自动获取并发送当前位置信息
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong>预设联系人：</strong>提前设置好信任的紧急联系人，紧急时快速联系
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong>定位权限：</strong>请确保已开启浏览器的定位权限，以便准确发送位置
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 路线小助手标签页 */}
        {selectedTab === 'ai-advisor' && (
          <div className="bg-white rounded-xl shadow-lg">
            <WomenSafetyAdvisor />
          </div>
        )}
      </div>
    </div>
  );
};

export default WomenSafety;