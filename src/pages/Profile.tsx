import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, Camera, Settings, Bell, Shield, Heart, Target, Award } from 'lucide-react';

interface UserProfile {
  nickname: string;
  email: string;
  phone: string;
  location: string;
  birthday: string;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  runningGoal: string;
  preferredDistance: string;
  interests: string[];
}

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    nickname: '跑步爱好者',
    email: 'runner@example.com',
    phone: '138****8888',
    location: '上海市浦东新区',
    birthday: '1990-01-01',
    gender: 'male',
    height: 175,
    weight: 70,
    runningGoal: '每周跑步3次',
    preferredDistance: '5-10公里',
    interests: ['晨跑', '夜跑', '马拉松', '健身']
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    // 这里应该调用API保存数据
    console.log('保存用户资料:', editedProfile);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const interestOptions = ['晨跑', '夜跑', '马拉松', '健身', '减肥', '竞赛', '社交跑', '越野跑'];

  const toggleInterest = (interest: string) => {
    const currentInterests = editedProfile.interests;
    if (currentInterests.includes(interest)) {
      handleInputChange('interests', currentInterests.filter(i => i !== interest));
    } else {
      handleInputChange('interests', [...currentInterests, interest]);
    }
  };

  const stats = [
    { label: '总跑步次数', value: '128', icon: Target, color: 'text-blue-500' },
    { label: '总距离', value: '856.2 km', icon: MapPin, color: 'text-green-500' },
    { label: '总时长', value: '72h 15m', icon: Calendar, color: 'text-orange-500' },
    { label: '获得徽章', value: '12', icon: Award, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* 头部信息 */}
        <div className="bg-white rounded-lg lg:rounded-xl shadow-sm mb-4 lg:mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 lg:py-12">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400" />
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center sm:text-left text-white">
                <h1 className="text-xl lg:text-2xl font-bold mb-2">{profile.nickname}</h1>
                <p className="text-blue-100 text-sm lg:text-base">{profile.email}</p>
                <p className="text-blue-100 text-sm">{profile.location}</p>
              </div>
              <div className="sm:ml-auto">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    编辑资料
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      取消
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg lg:rounded-xl p-4 lg:p-6 text-center shadow-sm">
                <Icon className={`h-6 w-6 lg:h-8 lg:w-8 ${stat.color} mx-auto mb-2 lg:mb-3`} />
                <p className="text-lg lg:text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs lg:text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-lg lg:rounded-xl shadow-sm p-4 lg:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-500" />
              基本信息
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.nickname}
                    onChange={(e) => handleInputChange('nickname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profile.nickname}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profile.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profile.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所在地区</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profile.location}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">身高 (cm)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedProfile.height}
                      onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.height} cm</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedProfile.weight}
                      onChange={(e) => handleInputChange('weight', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.weight} kg</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 运动偏好 */}
          <div className="bg-white rounded-lg lg:rounded-xl shadow-sm p-4 lg:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              运动偏好
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">跑步目标</label>
                {isEditing ? (
                  <select
                    value={editedProfile.runningGoal}
                    onChange={(e) => handleInputChange('runningGoal', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="每周跑步1次">每周跑步1次</option>
                    <option value="每周跑步2次">每周跑步2次</option>
                    <option value="每周跑步3次">每周跑步3次</option>
                    <option value="每周跑步4次以上">每周跑步4次以上</option>
                    <option value="准备马拉松">准备马拉松</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.runningGoal}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">偏好距离</label>
                {isEditing ? (
                  <select
                    value={editedProfile.preferredDistance}
                    onChange={(e) => handleInputChange('preferredDistance', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1-3公里">1-3公里</option>
                    <option value="3-5公里">3-5公里</option>
                    <option value="5-10公里">5-10公里</option>
                    <option value="10-21公里">10-21公里</option>
                    <option value="21公里以上">21公里以上</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.preferredDistance}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">兴趣标签</label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          editedProfile.interests.includes(interest)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 设置选项 */}
        <div className="mt-4 lg:mt-6 bg-white rounded-lg lg:rounded-xl shadow-sm p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-500" />
            设置
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">推送通知</p>
                  <p className="text-sm text-gray-500">接收跑步提醒和活动通知</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">隐私设置</p>
                  <p className="text-sm text-gray-500">控制个人信息的可见性</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                管理
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">位置服务</p>
                  <p className="text-sm text-gray-500">允许应用访问位置信息</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;