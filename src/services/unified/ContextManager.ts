// 上下文管理器 - 管理GPS和AI的上下文信息
import type { AIContext, UserContext, LocationContext, SafetyContext } from '../../types/unified';

export class ContextManager {
  private currentContext: AIContext;
  private contextHistory: AIContext[] = [];
  private maxHistorySize = 50;

  constructor() {
    this.currentContext = this.createDefaultContext();
  }

  /**
   * 创建默认上下文
   */
  private createDefaultContext(): AIContext {
    return {
      userContext: {
        preferences: {},
        profile: {},
        settings: {}
      },
      locationData: {
        currentLocation: null,
        recentLocations: [],
        routeHistory: []
      },
      safetyContext: {
        riskLevel: 'low',
        safetyScore: 0.8,
        alerts: []
      },
      timestamp: new Date()
    };
  }

  /**
   * 获取当前上下文
   */
  getCurrentContext(): AIContext {
    return { ...this.currentContext };
  }

  /**
   * 更新用户上下文
   */
  updateUserContext(userContext: Partial<UserContext>): void {
    this.currentContext.userContext = {
      ...this.currentContext.userContext,
      ...userContext
    };
    this.updateTimestamp();
    this.saveToHistory();
  }

  /**
   * 更新位置上下文
   */
  updateLocationContext(locationData: Partial<LocationContext>): void {
    this.currentContext.locationData = {
      ...this.currentContext.locationData,
      ...locationData
    };
    this.updateTimestamp();
    this.saveToHistory();
  }

  /**
   * 更新安全上下文
   */
  updateSafetyContext(safetyContext: Partial<SafetyContext>): void {
    this.currentContext.safetyContext = {
      ...this.currentContext.safetyContext,
      ...safetyContext
    };
    this.updateTimestamp();
    this.saveToHistory();
  }

  /**
   * 获取用户上下文
   */
  getUserContext(): UserContext {
    return { ...this.currentContext.userContext };
  }

  /**
   * 获取位置上下文
   */
  getLocationContext(): LocationContext {
    return { ...this.currentContext.locationData };
  }

  /**
   * 获取安全上下文
   */
  getSafetyContext(): SafetyContext {
    return { ...this.currentContext.safetyContext };
  }

  /**
   * 获取上下文历史
   */
  getContextHistory(limit?: number): AIContext[] {
    const history = [...this.contextHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * 清除上下文历史
   */
  clearHistory(): void {
    this.contextHistory = [];
  }

  /**
   * 重置上下文
   */
  resetContext(): void {
    this.currentContext = this.createDefaultContext();
    this.saveToHistory();
  }

  /**
   * 更新时间戳
   */
  private updateTimestamp(): void {
    this.currentContext.timestamp = new Date();
  }

  /**
   * 保存到历史记录
   */
  private saveToHistory(): void {
    this.contextHistory.push({ ...this.currentContext });
    
    // 保持历史记录大小
    if (this.contextHistory.length > this.maxHistorySize) {
      this.contextHistory.shift();
    }
  }

  /**
   * 获取上下文摘要
   */
  getContextSummary(): any {
    return {
      userPreferences: Object.keys(this.currentContext.userContext.preferences || {}).length,
      hasCurrentLocation: !!this.currentContext.locationData.currentLocation,
      recentLocationsCount: this.currentContext.locationData.recentLocations?.length || 0,
      safetyRiskLevel: this.currentContext.safetyContext.riskLevel,
      safetyScore: this.currentContext.safetyContext.safetyScore,
      lastUpdated: this.currentContext.timestamp,
      historySize: this.contextHistory.length
    };
  }
}

export default ContextManager;