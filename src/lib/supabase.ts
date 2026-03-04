import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 验证环境变量是否有效
function isValidSupabaseConfig(url?: string, key?: string): boolean {
  if (!url || !key) return false;
  
  // 检查是否为占位符值
  const placeholderPatterns = [
    'placeholder',
    'your_supabase',
    'your-supabase',
    'example.com',
    'localhost'
  ];
  
  const isUrlValid = url.startsWith('https://') && 
                    url.includes('.supabase.co') && 
                    !placeholderPatterns.some(pattern => url.includes(pattern));
  
  const isKeyValid = key.length > 20 && 
                    !placeholderPatterns.some(pattern => key.includes(pattern));
  
  return isUrlValid && isKeyValid;
}

// 创建Supabase客户端（仅在配置有效时）
let supabase: SupabaseClient | null = null;

if (isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
  try {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
    console.log('✅ Supabase 客户端初始化成功');
  } catch (error) {
    console.error('❌ Supabase 客户端初始化失败:', error);
    supabase = null;
  }
} else {
  console.info('ℹ️ Supabase 未配置或配置无效，应用将在离线模式下运行');
  console.info('📝 如需启用数据库功能，请在 .env 文件中配置有效的 Supabase URL 和密钥');
}

// 导出客户端（可能为 null）
export { supabase };

// 辅助函数：检查 Supabase 是否可用
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}

// 辅助函数：安全地执行 Supabase 操作
export async function safeSupabaseOperation<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallback?: T
): Promise<T | null> {
  if (!supabase) {
    console.warn('Supabase 不可用，操作被跳过');
    return fallback ?? null;
  }
  
  try {
    return await operation(supabase);
  } catch (error) {
    console.error('Supabase 操作失败:', error);
    return fallback ?? null;
  }
}

// 辅助函数：获取用户认证状态（离线模式下返回 null）
export function getAuthUser() {
  if (!supabase) return null;
  return supabase.auth.getUser();
}

// 辅助函数：安全地进行认证操作
export async function safeAuthOperation<T>(
  operation: (auth: any) => Promise<T>,
  fallback?: T
): Promise<T | null> {
  if (!supabase) {
    console.warn('认证功能不可用（Supabase 未配置）');
    return fallback ?? null;
  }
  
  try {
    return await operation(supabase.auth);
  } catch (error) {
    console.error('认证操作失败:', error);
    return fallback ?? null;
  }
}

// 数据库类型定义
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email?: string;
          phone?: string;
          nickname: string;
          avatar_url?: string;
          height?: number;
          weight?: number;
          birth_date?: string;
          gender?: 'male' | 'female' | 'other';
          running_experience?: 'beginner' | 'intermediate' | 'advanced';
          weekly_goal?: number;
          monthly_goal?: number;
          interest_tags?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string;
          phone?: string;
          nickname: string;
          avatar_url?: string;
          height?: number;
          weight?: number;
          birth_date?: string;
          gender?: 'male' | 'female' | 'other';
          running_experience?: 'beginner' | 'intermediate' | 'advanced';
          weekly_goal?: number;
          monthly_goal?: number;
          interest_tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string;
          nickname?: string;
          avatar_url?: string;
          height?: number;
          weight?: number;
          birth_date?: string;
          gender?: 'male' | 'female' | 'other';
          running_experience?: 'beginner' | 'intermediate' | 'advanced';
          weekly_goal?: number;
          monthly_goal?: number;
          interest_tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      runs: {
        Row: {
          id: string;
          user_id: string;
          title?: string;
          distance: number;
          duration: number;
          pace: number;
          calories: number;
          route_data?: any;
          start_time: string;
          end_time: string;
          status: 'completed' | 'paused' | 'cancelled';
          weather?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          distance: number;
          duration: number;
          pace: number;
          calories: number;
          route_data?: any;
          start_time: string;
          end_time: string;
          status?: 'completed' | 'paused' | 'cancelled';
          weather?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          distance?: number;
          duration?: number;
          pace?: number;
          calories?: number;
          route_data?: any;
          start_time?: string;
          end_time?: string;
          status?: 'completed' | 'paused' | 'cancelled';
          weather?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      routes: {
        Row: {
          id: string;
          name: string;
          description?: string;
          distance: number;
          difficulty: 'easy' | 'medium' | 'hard';
          interest_tags: string[];
          route_data: any;
          rating: number;
          rating_count: number;
          created_by: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          distance: number;
          difficulty: 'easy' | 'medium' | 'hard';
          interest_tags: string[];
          route_data: any;
          rating?: number;
          rating_count?: number;
          created_by: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          distance?: number;
          difficulty?: 'easy' | 'medium' | 'hard';
          interest_tags?: string[];
          route_data?: any;
          rating?: number;
          rating_count?: number;
          created_by?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          ai_provider: 'kimi' | 'deepseek';
          conversation_type: 'general' | 'women_safety' | 'emergency' | 'safety' | 'route_recommendation' | 'challenge_competition';
          is_emergency: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          ai_provider: 'kimi' | 'deepseek';
          conversation_type?: 'general' | 'women_safety' | 'emergency' | 'safety' | 'route_recommendation' | 'challenge_competition';
          is_emergency?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          ai_provider?: 'kimi' | 'deepseek';
          conversation_type?: 'general' | 'women_safety' | 'emergency' | 'safety' | 'route_recommendation' | 'challenge_competition';
          is_emergency?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          metadata: any;
          confidence_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          metadata?: any;
          confidence_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          metadata?: any;
          confidence_score?: number;
          created_at?: string;
        };
      };
      ai_context: {
        Row: {
          id: string;
          conversation_id: string;
          location_data: any;
          user_context: any;
          safety_context: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          location_data?: any;
          user_context?: any;
          safety_context?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          location_data?: any;
          user_context?: any;
          safety_context?: any;
          created_at?: string;
        };
      };
      safety_profiles: {
        Row: {
          id: string;
          user_id: string;
          gender: string;
          preferences: any;
          emergency_contacts: any;
          safety_settings: any;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          gender?: string;
          preferences?: any;
          emergency_contacts?: any;
          safety_settings?: any;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          gender?: string;
          preferences?: any;
          emergency_contacts?: any;
          safety_settings?: any;
          updated_at?: string;
        };
      };
    };
  };
};