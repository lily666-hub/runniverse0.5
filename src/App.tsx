import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Run from './pages/Run';
import Stats from './pages/Stats';
import RouteLibrary from './pages/RouteLibrary';
import Community from './pages/Community';

import RouteDetail from './pages/RouteDetail';
import RouteDetailEnhanced from './pages/RouteDetailEnhanced';
import TaskCompletion from './pages/TaskCompletion';
import Challenges from './pages/Challenges';
import ChallengeDetail from './pages/ChallengeDetail';
import ChallengeProgress from './pages/ChallengeProgress';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFoundPage from './pages/NotFoundPage';
import APIKeyError from './pages/APIKeyError';
import RouteNavigation from './pages/RouteNavigation';

// 安全评估系统页面
import SafetyDashboard from './pages/SafetyDashboard';
import SafetyMonitor from './pages/SafetyMonitor';
import SafetyAssessment from './pages/SafetyAssessment';
import WomenSafety from './pages/WomenSafety';
import EmergencyResponse from './pages/EmergencyResponse';

// 路线小助手页面
import { 
  AIHome, 
  AIChat, 
  WomenSafetyPage, 
  EmergencyPage, 
  AnalysisPage,
  SafetyAdvisor
} from './pages/ai';

// AI挑战推荐页面
import ChallengeRecommendation from './pages/ai/ChallengeRecommendation';

// AI路线推荐页面
import RouteRecommendation from './pages/ai/RouteRecommendation';

// 设置页面
import { VoiceAssistant } from './pages/settings';

// AI智能路线推荐页面
import RouteRecommendationSettings from './pages/RouteRecommendationSettings';
import RouteRecommendationHistory from './pages/RouteRecommendationHistory';
import WeatherRecommendation from './pages/WeatherRecommendation';

// 路线地图集成演示页面
import RouteMapDemo from './components/ai/RouteMapDemo';
import UserPosts from './pages/UserPosts';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 认证路由 - 不使用Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 主应用路由 - 使用Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="run" element={<Run />} />
            <Route path="stats" element={<Stats />} />
            <Route path="routes" element={<RouteLibrary />} />
            <Route path="route/:id" element={<RouteDetailEnhanced />} />
            <Route path="route/:id/navigation" element={<RouteNavigation />} />
            <Route path="task-completion" element={<TaskCompletion />} />
            
            {/* 社区与社团详情路由 */}
            <Route path="community" element={<Community />} />
            <Route path="club/:id" element={<Community />} />
            <Route path="my-posts" element={<UserPosts />} />
            
            {/* AI智能路线推荐路由 */}
            <Route path="route-recommendation-settings" element={<RouteRecommendationSettings />} />
            <Route path="route-recommendation-history" element={<RouteRecommendationHistory />} />
            <Route path="weather-recommendation" element={<WeatherRecommendation />} />
            <Route path="route-map-demo" element={<RouteMapDemo />} />
            <Route path="challenges" element={<Challenges />} />
            <Route path="challenge-detail/:id" element={<ChallengeDetail />} />
            <Route path="challenge-progress/:challengeId" element={<ChallengeProgress />} />
            <Route path="profile" element={<Profile />} />
            
            {/* 安全评估系统路由 */}
            <Route path="safety" element={<SafetyDashboard />} />
            <Route path="safety/monitor" element={<SafetyMonitor />} />
            <Route path="safety/assessment" element={<SafetyAssessment />} />
            <Route path="safety/women" element={<WomenSafety />} />
            <Route path="safety/emergency" element={<EmergencyResponse />} />
            
            {/* AI安全顾问路由 */}
            <Route path="ai" element={<AIHome />} />
            <Route path="ai/chat" element={<AIChat />} />
            <Route path="ai/women-safety" element={<WomenSafetyPage />} />
            <Route path="ai/emergency" element={<EmergencyPage />} />
            <Route path="ai/analysis" element={<AnalysisPage />} />
            <Route path="ai/safety-advisor" element={<SafetyAdvisor />} />
            <Route path="ai/challenge-recommendation" element={<ChallengeRecommendation />} />
            <Route path="ai/route-recommendation" element={<RouteRecommendation />} />
            
            {/* 设置页面路由 */}
            <Route path="settings/voice-assistant" element={<VoiceAssistant />} />
            
            {/* 错误页面 */}
            <Route path="api-key-error" element={<APIKeyError />} />
          </Route>
          
          {/* 404页面 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
