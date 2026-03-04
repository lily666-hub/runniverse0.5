// 对话管理服务 - 处理AI对话的存储、检索和上下文管理
import { supabase } from '../../lib/supabase';
import type { 
  AIConversation, 
  AIMessage, 
  AIContext, 
  SafetyProfile,
  AIConversationStats,
  ImageUploadResponse
} from '../../types/ai';

export class ConversationManager {
  /**
   * 创建新对话
   */
  async createConversation(
    userId: string,
    options: {
      title?: string;
      aiProvider?: 'kimi' | 'deepseek';
      conversationType?: 'safety' | 'emergency' | 'general' | 'women_safety' | 'route_recommendation' | 'analysis';
      isEmergency?: boolean;
    }
  ): Promise<AIConversation> {
    const startTime = performance.now();
    
    try {
      console.group('🗄️ Supabase API - 创建对话');
      console.log('📊 请求参数:', {
        userId,
        title: options.title,
        aiProvider: options.aiProvider,
        conversationType: options.conversationType,
        isEmergency: options.isEmergency,
        timestamp: new Date().toISOString()
      });

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title: options.title || '新对话',
          ai_provider: options.aiProvider || 'kimi',
          conversation_type: options.conversationType || 'general',
          is_emergency: options.isEmergency || false,
        })
        .select()
        .single();

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (error) {
        console.error('❌ Supabase错误:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          responseTime: `${responseTime}ms`
        });
        console.groupEnd();
        
        // 如果是网络或认证错误，尝试离线模式
        if (this.shouldUseOfflineMode(error)) {
          console.warn('🔄 切换到离线模式创建对话');
          return this.createOfflineConversation(userId, options);
        }
        
        throw new Error(`创建对话失败: ${error.message}`);
      }

      console.log('✅ 创建成功:', {
        conversationId: data.id,
        responseTime: `${responseTime}ms`,
        data: JSON.stringify(data, null, 2)
      });
      console.groupEnd();

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        aiProvider: data.ai_provider,
        conversationType: data.conversation_type,
        isEmergency: data.is_emergency,
        isActive: data.is_active || true,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        messages: [],
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      console.group('❌ Supabase API 错误 - 创建对话');
      console.error('错误详情:', {
        error: error instanceof Error ? error.message : String(error),
        responseTime: `${responseTime}ms`,
        requestParams: { userId, title: options.title, aiProvider: options.aiProvider, conversationType: options.conversationType, isEmergency: options.isEmergency }
      });
      console.groupEnd();
      
      // 如果是网络或认证错误，尝试离线模式
      if (this.shouldUseOfflineMode(error)) {
        console.warn('🔄 切换到离线模式创建对话');
        return this.createOfflineConversation(userId, options);
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`创建对话失败: ${errorMessage}`);
    }
  }

  /**
   * 获取用户的对话列表
   */
  async getUserConversations(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    conversationType?: string
  ): Promise<AIConversation[]> {
    const startTime = performance.now();
    
    try {
      console.group('🗄️ Supabase API - 获取对话列表');
      console.log('📊 请求参数:', {
        userId,
        limit,
        offset,
        timestamp: new Date().toISOString()
      });

      let queryBuilder = supabase
        .from('ai_conversations')
        .select(`
          *,
          ai_messages (
            id,
            role,
            content,
            created_at,
            confidence_score,
            metadata
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (conversationType) {
        queryBuilder = queryBuilder.eq('conversation_type', conversationType);
      }

      const { data, error } = await queryBuilder;

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (error) {
        console.error('❌ Supabase错误:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          responseTime: `${responseTime}ms`
        });
        console.groupEnd();
        throw error;
      }

      console.log('✅ 查询成功:', {
        conversationCount: data.length,
        responseTime: `${responseTime}ms`,
        totalMessages: data.reduce((sum, conv) => sum + (conv.ai_messages?.length || 0), 0)
      });
      console.log('📋 返回数据:', JSON.stringify(data, null, 2));
      console.groupEnd();

      return data.map(conv => {
        const messagesArr = Array.isArray(conv.ai_messages) ? conv.ai_messages : [];
        return {
          id: conv.id,
          userId: conv.user_id,
          title: conv.title,
          aiProvider: conv.ai_provider,
          conversationType: conv.conversation_type,
          isEmergency: conv.is_emergency,
          isActive: conv.is_active || true,
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
          messages: messagesArr.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            confidenceScore: msg.confidence_score,
            metadata: msg.metadata,
          })),
          lastMessage: messagesArr.length > 0 ? messagesArr[messagesArr.length - 1].content : undefined,
          messageCount: messagesArr.length,
        };
      });
    } catch (error) {
      console.error('获取对话列表失败:', error);
      throw new Error('获取对话列表失败');
    }
  }

  /**
   * 获取单个对话详情
   */
  async getConversation(conversationId: string): Promise<AIConversation | null> {
    // 检查是否是离线对话
    if (conversationId.startsWith('offline_')) {
      return this.getOfflineConversation(conversationId);
    }

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select(`
          *,
          ai_messages (
            id,
            role,
            content,
            created_at,
            confidence_score,
            metadata
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // 未找到
        
        // 如果是网络或认证错误，尝试从离线存储获取
        if (this.shouldUseOfflineMode(error)) {
          console.warn('🔄 尝试从离线存储获取对话');
          return this.getOfflineConversation(conversationId);
        }
        
        throw error;
      }

      const messagesArr = Array.isArray(data.ai_messages) ? data.ai_messages : [];
      const sortedMessages = messagesArr
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          confidenceScore: msg.confidence_score,
          metadata: msg.metadata,
        }));

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        aiProvider: data.ai_provider,
        conversationType: data.conversation_type,
        isEmergency: data.is_emergency,
        isActive: data.is_active || true,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        messages: sortedMessages,
        lastMessage: sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].content : undefined,
        messageCount: sortedMessages.length,
      };
    } catch (error) {
      console.error('获取对话详情失败:', error);
      
      // 如果是网络或认证错误，尝试从离线存储获取
      if (this.shouldUseOfflineMode(error)) {
        console.warn('🔄 尝试从离线存储获取对话');
        return this.getOfflineConversation(conversationId);
      }
      
      throw new Error('获取对话详情失败');
    }
  }

  /**
   * 添加消息到对话
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    images?: ImageUploadResponse[],
    metadata?: Record<string, any>,
    confidenceScore?: number
  ): Promise<AIMessage> {
    // 检查是否是离线对话
    if (conversationId.startsWith('offline_')) {
      return this.addOfflineMessage(conversationId, role, content, images, metadata, confidenceScore);
    }

    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          images: images || [],
          metadata: metadata || {},
          confidence_score: confidenceScore || 0,
        })
        .select()
        .single();

      if (error) {
        // 如果是网络或认证错误，尝试离线模式
        if (this.shouldUseOfflineMode(error)) {
          console.warn('🔄 切换到离线模式添加消息');
          return this.addOfflineMessage(conversationId, role, content, images, metadata, confidenceScore);
        }
        throw error;
      }

      // 更新对话的更新时间
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return {
        id: data.id,
        role: data.role,
        content: data.content,
        timestamp: new Date(data.created_at),
        metadata: data.metadata,
        confidenceScore: data.confidence_score,
        images: data.images,
      };
    } catch (error) {
      console.error('添加消息失败:', error);
      
      // 如果是网络或认证错误，尝试离线模式
      if (this.shouldUseOfflineMode(error)) {
        console.warn('🔄 切换到离线模式添加消息');
        return this.addOfflineMessage(conversationId, role, content, images, metadata, confidenceScore);
      }
      
      throw new Error('添加消息失败');
    }
  }

  /**
   * 保存对话上下文
   */
  async saveContext(
    conversationId: string,
    locationData?: any,
    userContext?: any,
    safetyContext?: any
  ): Promise<AIContext> {
    try {
      const { data, error } = await supabase
        .from('ai_context')
        .insert({
          conversation_id: conversationId,
          location_data: locationData || {},
          user_context: userContext || {},
          safety_context: safetyContext || {},
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        conversationId: data.conversation_id,
        locationData: data.location_data,
        userContext: data.user_context,
        safetyContext: data.safety_context,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('保存上下文失败:', error);
      throw new Error('保存上下文失败');
    }
  }

  /**
   * 获取对话上下文
   */
  async getContext(conversationId: string): Promise<AIContext | null> {
    try {
      const { data, error } = await supabase
        .from('ai_context')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // 未找到
        throw error;
      }

      return {
        id: data.id,
        conversationId: data.conversation_id,
        locationData: data.location_data,
        userContext: data.user_context,
        safetyContext: data.safety_context,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('获取上下文失败:', error);
      return null;
    }
  }

  /**
   * 更新对话标题
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('更新对话标题失败:', error);
      throw new Error('更新对话标题失败');
    }
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('删除对话失败:', error);
      throw new Error('删除对话失败');
    }
  }

  /**
   * 获取用户安全档案
   */
  async getSafetyProfile(userId: string): Promise<SafetyProfile | null> {
    try {
      const { data, error } = await supabase
        .from('safety_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // 未找到
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        gender: data.gender,
        preferences: data.preferences,
        emergencyContacts: data.emergency_contacts,
        safetySettings: data.safety_settings,
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('获取安全档案失败:', error);
      return null;
    }
  }

  /**
   * 创建或更新用户安全档案
   */
  async upsertSafetyProfile(
    userId: string,
    profile: Partial<SafetyProfile>
  ): Promise<SafetyProfile> {
    try {
      const { data, error } = await supabase
        .from('safety_profiles')
        .upsert({
          user_id: userId,
          gender: profile.gender,
          preferences: profile.preferences || {},
          emergency_contacts: profile.emergencyContacts || [],
          safety_settings: profile.safetySettings || {},
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        gender: data.gender,
        preferences: data.preferences,
        emergencyContacts: data.emergency_contacts,
        safetySettings: data.safety_settings,
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('保存安全档案失败:', error);
      throw new Error('保存安全档案失败');
    }
  }

  /**
   * 获取用户对话统计
   */
  async getConversationStats(userId: string): Promise<AIConversationStats> {
    try {
      const { data, error } = await supabase
        .from('ai_conversation_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 如果没有统计数据，返回默认值
          return {
            totalConversations: 0,
            totalMessages: 0,
            activeConversations: 0,
            averageResponseTime: 1.2,
            womenSafetyConversations: 0,
            emergencyConversations: 0,
            emergencySessions: 0,
            lastConversationAt: new Date(),
          };
        }
        throw error;
      }

      return {
        totalConversations: data.total_conversations,
        totalMessages: data.total_messages || 0,
        activeConversations: data.active_conversations || 0,
        averageResponseTime: data.average_response_time || 1.2,
        womenSafetyConversations: data.women_safety_conversations,
        emergencyConversations: data.emergency_conversations,
        emergencySessions: data.emergency_sessions,
        lastConversationAt: new Date(data.last_conversation_at),
      };
    } catch (error) {
      console.error('获取对话统计失败:', error);
      throw new Error('获取对话统计失败');
    }
  }

  /**
   * 搜索对话
   */
  async searchConversations(
    userId: string,
    query: string,
    conversationType?: string
  ): Promise<AIConversation[]> {
    try {
      let queryBuilder = supabase
        .from('ai_conversations')
        .select(`
          *,
          ai_messages (
            id,
            role,
            content,
            created_at,
            confidence_score,
            metadata
          )
        `)
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,ai_messages.content.ilike.%${query}%`)
        .order('updated_at', { ascending: false });

      if (conversationType) {
        queryBuilder = queryBuilder.eq('conversation_type', conversationType);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return data.map(conv => ({
        id: conv.id,
        userId: conv.user_id,
        title: conv.title,
        aiProvider: conv.ai_provider,
        conversationType: conv.conversation_type,
        isEmergency: conv.is_emergency,
        isActive: conv.is_active || true,
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
        messages: conv.ai_messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          confidenceScore: msg.confidence_score,
          metadata: msg.metadata,
        })),
        lastMessage: conv.ai_messages.length > 0 ? conv.ai_messages[conv.ai_messages.length - 1].content : undefined,
        messageCount: conv.ai_messages.length,
      }));
    } catch (error) {
      console.error('搜索对话失败:', error);
      throw new Error('搜索对话失败');
    }
  }

  /**
   * 判断是否应该使用离线模式
   */
  private shouldUseOfflineMode(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || '';
    const errorCode = error.code || '';
    
    // 网络连接错误
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
      return true;
    }
    
    // Supabase 认证错误
    if (errorCode === 'PGRST301' || errorCode === '401' || errorMessage.includes('JWT')) {
      return true;
    }
    
    // 行级安全(RLS)/权限错误也回退到离线，保障匿名/未登录用户可用
    const msgLower = errorMessage.toLowerCase();
    if (
      errorCode === '42501' || // insufficient_privilege
      msgLower.includes('row level') ||
      msgLower.includes('rls') ||
      msgLower.includes('policy') ||
      msgLower.includes('permission') ||
      msgLower.includes('access denied') ||
      msgLower.includes('not allowed')
    ) {
      return true;
    }

    // 服务不可用
    if (errorCode === '503' || errorMessage.includes('Service Unavailable')) {
      return true;
    }
    
    // 连接超时
    if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
      return true;
    }
    
    return false;
  }

  /**
   * 创建离线对话
   */
  private createOfflineConversation(
    userId: string,
    options: {
      title?: string;
      aiProvider?: 'kimi' | 'deepseek';
      conversationType?: 'safety' | 'emergency' | 'general' | 'women_safety' | 'route_recommendation' | 'analysis';
      isEmergency?: boolean;
    }
  ): AIConversation {
    console.group('💾 离线模式 - 创建对话');
    
    // 生成离线对话ID
    const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const conversation: AIConversation = {
      id: offlineId,
      userId,
      title: options.title || '新对话',
      aiProvider: options.aiProvider || 'kimi',
      conversationType: options.conversationType || 'general',
      isEmergency: options.isEmergency || false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      messages: [],
      isOffline: true, // 标记为离线对话
    };

    // 保存到本地存储
    this.saveOfflineConversation(conversation);
    
    console.log('✅ 离线对话创建成功:', {
      conversationId: conversation.id,
      title: conversation.title,
      conversationType: conversation.conversationType
    });
    console.groupEnd();
    
    return conversation;
  }

  /**
   * 保存离线对话到本地存储
   */
  private saveOfflineConversation(conversation: AIConversation): void {
    try {
      const key = `offline_conversation_${conversation.id}`;
      localStorage.setItem(key, JSON.stringify(conversation));
      
      // 更新离线对话列表
      const offlineListKey = `offline_conversations_${conversation.userId}`;
      const existingList = JSON.parse(localStorage.getItem(offlineListKey) || '[]');
      const updatedList = [conversation.id, ...existingList.filter((id: string) => id !== conversation.id)];
      localStorage.setItem(offlineListKey, JSON.stringify(updatedList));
      
      console.log('💾 离线对话已保存到本地存储');
    } catch (error) {
      console.error('❌ 保存离线对话失败:', error);
    }
  }

  /**
   * 获取离线对话
   */
  private getOfflineConversation(conversationId: string): AIConversation | null {
    try {
      // 如果conversationId已经包含offline_前缀，直接使用，否则添加前缀
      const key = conversationId.startsWith('offline_') 
        ? `offline_conversation_${conversationId}`
        : `offline_conversation_offline_${conversationId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const conversation = JSON.parse(data);
        // 转换日期字符串为Date对象
        conversation.createdAt = new Date(conversation.createdAt);
        conversation.updatedAt = new Date(conversation.updatedAt);
        if (conversation.messages) {
          conversation.messages = conversation.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
        console.log('✅ 成功获取离线对话:', {
          conversationId,
          title: conversation.title,
          messageCount: conversation.messages?.length || 0
        });
        return conversation;
      } else {
        console.warn('⚠️ 离线对话不存在:', conversationId);
        return null;
      }
    } catch (error) {
      console.error('❌ 获取离线对话失败:', error);
      return null;
    }
  }

  /**
   * 添加离线消息
   */
  async addOfflineMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    images?: ImageUploadResponse[],
    metadata?: Record<string, any>,
    confidenceScore?: number
  ): Promise<AIMessage> {
    console.log('💾 添加离线消息:', { conversationId, role, content: content.substring(0, 50) + '...' });
    
    const conversation = this.getOfflineConversation(conversationId);
    if (!conversation) {
      console.error('❌ 离线对话不存在:', conversationId);
      throw new Error(`离线对话不存在: ${conversationId}`);
    }

    const message: AIMessage = {
      id: `offline_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      images,
      metadata,
      confidenceScore,
      isOffline: true,
    };

    conversation.messages = [...(conversation.messages || []), message];
    conversation.updatedAt = new Date();
    
    this.saveOfflineConversation(conversation);
    
    console.log('💾 离线消息已添加:', {
      conversationId,
      messageId: message.id,
      role,
      content: content.substring(0, 50) + '...'
    });
    
    return message;
  }

  /**
   * 获取用户的离线对话列表
   */
  getOfflineConversations(userId: string): AIConversation[] {
    try {
      const offlineListKey = `offline_conversations_${userId}`;
      const conversationIds = JSON.parse(localStorage.getItem(offlineListKey) || '[]');
      
      const conversations: AIConversation[] = [];
      for (const id of conversationIds) {
        const conversation = this.getOfflineConversation(id);
        if (conversation) {
          conversations.push(conversation);
        }
      }
      
      // 按更新时间排序
      return conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('❌ 获取离线对话列表失败:', error);
      return [];
    }
  }
}
