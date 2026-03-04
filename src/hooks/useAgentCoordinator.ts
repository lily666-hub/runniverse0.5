import { useState, useEffect, useCallback } from 'react';
import { agentCoordinator, AgentCoordinationEvent, CrossAgentData, AgentSyncState } from '../services/ai/agentCoordinator';
import { useAuth } from './useAuth';

/**
 * 智能体协调器 Hook
 * 提供智能体间协调功能的 React Hook
 */
export const useAgentCoordinator = () => {
  const { user } = useAuth();
  const [crossAgentData, setCrossAgentData] = useState<CrossAgentData | null>(null);
  const [syncState, setSyncState] = useState<AgentSyncState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 初始化协调器
   */
  const initialize = useCallback(async () => {
    if (!user?.id || isInitialized) return;

    setIsLoading(true);
    try {
      await agentCoordinator.initialize(user.id);
      setCrossAgentData(agentCoordinator.getCrossAgentData());
      setSyncState(agentCoordinator.getSyncState());
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize agent coordinator:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isInitialized]);

  /**
   * 触发协调事件
   */
  const triggerEvent = useCallback(async (event: Omit<AgentCoordinationEvent, 'timestamp' | 'userId'>) => {
    if (!isInitialized || !user?.id) return;

    try {
      await agentCoordinator.triggerEvent({
        ...event,
        timestamp: new Date(),
        userId: user.id
      });
      
      // 更新本地状态
      setCrossAgentData(agentCoordinator.getCrossAgentData());
      setSyncState(agentCoordinator.getSyncState());
    } catch (error) {
      console.error('Failed to trigger coordination event:', error);
    }
  }, [isInitialized, user?.id]);

  /**
   * 同步所有智能体
   */
  const syncAllAgents = useCallback(async () => {
    if (!isInitialized || !user?.id) return;

    setIsLoading(true);
    try {
      await agentCoordinator.syncAllAgents(user.id);
      setCrossAgentData(agentCoordinator.getCrossAgentData());
      setSyncState(agentCoordinator.getSyncState());
    } catch (error) {
      console.error('Failed to sync all agents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, user?.id]);

  /**
   * 获取特定智能体的数据
   */
  const getAgentData = useCallback((agentType: 'route' | 'challenge' | 'safety') => {
    if (!isInitialized) return null;
    return agentCoordinator.getAgentData(agentType);
  }, [isInitialized]);

  /**
   * 注册事件监听器
   */
  const addEventListener = useCallback((eventType: string, callback: Function) => {
    agentCoordinator.addEventListener(eventType, callback);
    
    // 返回清理函数
    return () => {
      agentCoordinator.removeEventListener(eventType, callback);
    };
  }, []);

  /**
   * 路线选择事件
   */
  const onRouteSelected = useCallback(async (routeData: any) => {
    await triggerEvent({
      type: 'route_selected',
      agentId: 'route-agent',
      data: routeData
    });
  }, [triggerEvent]);

  /**
   * 挑战开始事件
   */
  const onChallengeStarted = useCallback(async (challengeData: any) => {
    await triggerEvent({
      type: 'challenge_started',
      agentId: 'challenge-agent',
      data: challengeData
    });
  }, [triggerEvent]);

  /**
   * 安全警报事件
   */
  const onSafetyAlert = useCallback(async (alertData: any) => {
    await triggerEvent({
      type: 'safety_alert',
      agentId: 'safety-agent',
      data: alertData
    });
  }, [triggerEvent]);

  /**
   * 用户偏好更新事件
   */
  const onUserPreferenceUpdated = useCallback(async (preferences: any) => {
    await triggerEvent({
      type: 'user_preference_updated',
      agentId: 'user-preference',
      data: preferences
    });
  }, [triggerEvent]);

  // 自动初始化
  useEffect(() => {
    if (user?.id && !isInitialized) {
      initialize();
    }
  }, [user?.id, isInitialized, initialize]);

  // 清理资源
  useEffect(() => {
    return () => {
      if (isInitialized) {
        agentCoordinator.cleanup();
      }
    };
  }, [isInitialized]);

  return {
    // 状态
    crossAgentData,
    syncState,
    isInitialized,
    isLoading,
    
    // 方法
    initialize,
    triggerEvent,
    syncAllAgents,
    getAgentData,
    addEventListener,
    
    // 便捷事件方法
    onRouteSelected,
    onChallengeStarted,
    onSafetyAlert,
    onUserPreferenceUpdated
  };
};