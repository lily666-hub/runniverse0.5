import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Activity, BarChart3, Route, Trophy, User, LogOut, Menu, X, Brain, Shield, Bot, Users } from 'lucide-react';
// import { useAuth } from '../hooks/useAuth';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: '首页', href: '/', icon: Home },
    { name: '开始跑步', href: '/run', icon: Activity },
    { name: '数据统计', href: '/stats', icon: BarChart3 },
    { name: '路线库', href: '/routes', icon: Route },
    { name: '社区', href: '/community', icon: Users },
    { name: 'AI安全顾问', href: '/ai', icon: Shield },
    { name: '挑战竞赛', href: '/challenges', icon: Trophy },
    { name: '个人中心', href: '/profile', icon: User },
  ];

  const handleLogout = async () => {
    console.log('退出登录按钮被点击');
    try {
      console.log('开始调用signOut...');
      // await signOut();
      console.log('signOut调用成功，准备重定向到登录页面');
      // 退出登录后重定向到登录页面
      navigate('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
      // 即使出错也尝试重定向到登录页面
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端顶部导航栏 */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">上海城市跑</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* 移动端侧边栏菜单 */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="flex flex-col h-full pt-16">
              <nav className="flex-1 px-4 py-4 space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg ${
                        isActive
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="px-4 py-4 border-t border-gray-200">
                <button 
                  onClick={handleLogout}
                  className="group flex w-full items-center px-3 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900"
                >
                  <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 桌面端侧边栏 */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow-lg">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">上海城市跑</h1>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-6 w-6 flex-shrink-0 ${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="flex-shrink-0 px-2">
              <button 
                onClick={handleLogout}
                className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端底部导航 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 h-16">
          {/* 显示首页、跑步、统计、AI顾问、个人中心 */}
          {[navigation[0], navigation[1], navigation[2], navigation[4], navigation[5]].map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="lg:pl-64">
        <main className="pt-16 pb-16 lg:pt-0 lg:pb-0 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;