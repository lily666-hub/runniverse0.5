import { useState, useEffect, useCallback } from 'react';
import { emergencyService, EmergencyContact, EmergencyEvent } from '../services/emergencyService';
import { useLocationTracking } from './useLocationTracking';
import { EmergencyType } from '../types';

export interface EmergencySettings {
  autoAlert: boolean;
  alertDelay: number; // 秒
  includeLocation: boolean;
  includePhoto: boolean;
  includeAudio: boolean;
}

export interface UseEmergencyReturn {
  // 状态
  isEmergencyActive: boolean;
  activeEmergency: EmergencyEvent | null;
  emergencyContacts: EmergencyContact[];
  emergencyHistory: EmergencyEvent[];
  countdown: number;
  isLoading: boolean;
  error: string | null;
  
  // 紧急求救操作
  triggerEmergency: (type: EmergencyType, description?: string) => Promise<void>;
  cancelEmergency: (reason?: string) => Promise<void>;
  resolveEmergency: (resolution?: string) => Promise<void>;
  
  // 联系人管理
  addContact: (contact: Omit<EmergencyContact, 'id'>) => Promise<void>;
  removeContact: (contactId: string) => Promise<void>;
  refreshContacts: () => Promise<void>;
  
  // 历史记录
  refreshHistory: () => Promise<void>;
  
  // 设置
  settings: EmergencySettings;
  updateSettings: (newSettings: Partial<EmergencySettings>) => void;
}

const defaultSettings: EmergencySettings = {
  autoAlert: true,
  alertDelay: 10,
  includeLocation: true,
  includePhoto: false,
  includeAudio: true
};

export const useEmergency = (): UseEmergencyReturn => {
  const { location: currentLocation } = useLocationTracking();
  
  // 状态管理
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<EmergencyEvent | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyEvent[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<EmergencySettings>(defaultSettings);

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isEmergencyActive && activeEmergency) {
      // 倒计时结束，自动确认紧急求救
      handleEmergencyConfirm();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, isEmergencyActive, activeEmergency]);

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        refreshContacts(),
        refreshHistory()
      ]);
      
      // 检查是否有活跃的紧急事件
      const active = emergencyService.getActiveEmergency();
      if (active) {
        setActiveEmergency(active);
        setIsEmergencyActive(true);
      }
    };
    
    initializeData();
  }, []);

  // 从localStorage加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('emergencySettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('加载紧急设置失败:', error);
      }
    }
  }, []);

  // 保存设置到localStorage
  const updateSettings = useCallback((newSettings: Partial<EmergencySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('emergencySettings', JSON.stringify(updatedSettings));
  }, [settings]);

  // 触发紧急求救
  const triggerEmergency = useCallback(async (type: EmergencyType, description?: string) => {
    if (isEmergencyActive) {
      setError('已有活跃的紧急事件');
      return;
    }

    if (!currentLocation) {
      setError('无法获取当前位置，请确保位置服务已开启');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsEmergencyActive(true);
      
      // 如果设置了延迟，开始倒计时
      if (settings.alertDelay > 0) {
        setCountdown(settings.alertDelay);
      }

      const emergency = await emergencyService.triggerEmergency(
        type,
        currentLocation,
        description,
        {
          includeAudio: settings.includeAudio,
          includePhoto: settings.includePhoto,
          autoAlert: settings.autoAlert && settings.alertDelay === 0, // 如果没有延迟则立即发送
          alertDelay: settings.alertDelay
        }
      );

      setActiveEmergency(emergency);
      
      // 如果没有延迟，立即发送警报
      if (settings.alertDelay === 0) {
        await emergencyService.sendEmergencyAlerts(emergency.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '触发紧急求救失败');
      setIsEmergencyActive(false);
      setCountdown(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, settings, isEmergencyActive]);

  // 确认紧急求救（倒计时结束时调用）
  const handleEmergencyConfirm = useCallback(async () => {
    if (!activeEmergency) return;

    try {
      await emergencyService.sendEmergencyAlerts(activeEmergency.id);
      setCountdown(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送紧急警报失败');
    }
  }, [activeEmergency]);

  // 取消紧急求救
  const cancelEmergency = useCallback(async (reason?: string) => {
    if (!activeEmergency) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await emergencyService.cancelEmergency(activeEmergency.id, reason);
      
      setIsEmergencyActive(false);
      setActiveEmergency(null);
      setCountdown(0);
      
      // 刷新历史记录
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : '取消紧急求救失败');
    } finally {
      setIsLoading(false);
    }
  }, [activeEmergency]);

  // 解决紧急事件
  const resolveEmergency = useCallback(async (resolution?: string) => {
    if (!activeEmergency) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await emergencyService.resolveEmergency(activeEmergency.id, resolution);
      
      setIsEmergencyActive(false);
      setActiveEmergency(null);
      setCountdown(0);
      
      // 刷新历史记录
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : '解决紧急事件失败');
    } finally {
      setIsLoading(false);
    }
  }, [activeEmergency]);

  // 添加紧急联系人
  const addContact = useCallback(async (contact: Omit<EmergencyContact, 'id'>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await emergencyService.addEmergencyContact(contact);
      await refreshContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加紧急联系人失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 删除紧急联系人
  const removeContact = useCallback(async (contactId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await emergencyService.removeEmergencyContact(contactId);
      await refreshContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除紧急联系人失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 刷新联系人列表
  const refreshContacts = useCallback(async () => {
    try {
      const contacts = await emergencyService.getEmergencyContacts();
      setEmergencyContacts(contacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取紧急联系人失败');
    }
  }, []);

  // 刷新历史记录
  const refreshHistory = useCallback(async () => {
    try {
      const history = await emergencyService.getEmergencyHistory();
      setEmergencyHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取紧急事件历史失败');
    }
  }, []);

  return {
    // 状态
    isEmergencyActive,
    activeEmergency,
    emergencyContacts,
    emergencyHistory,
    countdown,
    isLoading,
    error,
    
    // 紧急求救操作
    triggerEmergency,
    cancelEmergency,
    resolveEmergency,
    
    // 联系人管理
    addContact,
    removeContact,
    refreshContacts,
    
    // 历史记录
    refreshHistory,
    
    // 设置
    settings,
    updateSettings
  };
}