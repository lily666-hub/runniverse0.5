import { Database } from '../database/Database';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  experience: 'beginner' | 'intermediate' | 'advanced';
  avatar?: string;
  bio?: string;
  location?: {
    lng: number;
    lat: number;
    address?: string;
  };
  preferences: {
    preferredDistance: number;
    preferredTime: string[];
    safetyLevel: 'low' | 'medium' | 'high';
    notifications: {
      emergency: boolean;
      buddy: boolean;
      safety: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface RunningActivity {
  id?: string;
  userId: string;
  route: {
    name: string;
    points: Array<{ lng: number; lat: number; timestamp: number }>;
    distance: number;
    duration: number;
  };
  startTime: string;
  endTime: string;
  averageSpeed: number;
  calories: number;
  safetyScore: number;
  weather?: {
    temperature: number;
    humidity: number;
    condition: string;
  };
  notes?: string;
}

export interface RunningBuddy {
  id: string;
  username: string;
  avatar?: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  experience: 'beginner' | 'intermediate' | 'advanced';
  location: {
    lng: number;
    lat: number;
    address?: string;
  };
  distance: number;
  safetyScore: number;
  preferences: {
    preferredDistance: number;
    preferredTime: string[];
  };
  isOnline: boolean;
  lastActive: string;
}

export interface RunningInvitation {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: {
    username: string;
    avatar?: string;
  };
  toUser: {
    username: string;
    avatar?: string;
  };
  scheduledTime: string;
  route: {
    name: string;
    distance: number;
    estimatedDuration: number;
  };
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  respondedAt?: string;
}

export interface UserStats {
  totalRuns: number;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  averageSafetyScore: number;
  favoriteRoutes: Array<{
    name: string;
    count: number;
    averageTime: number;
  }>;
  weeklyStats: Array<{
    week: string;
    runs: number;
    distance: number;
    duration: number;
  }>;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'distance' | 'frequency' | 'safety' | 'social';
  unlockedAt?: string;
  progress?: {
    current: number;
    target: number;
  };
}

export class UserService {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  // 获取用户资料
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const result = await this.db.query(`
        SELECT u.*, up.preferences 
        FROM users u
        LEFT JOIN user_preferences up ON u.id = up.user_id
        WHERE u.id = $1
      `, [userId]);

      if (result.length === 0) {
        return null;
      }

      return this.mapUserProfile(result[0]);
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  // 更新用户资料
  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (profile.username) {
        updateFields.push(`username = $${paramIndex++}`);
        values.push(profile.username);
      }
      if (profile.email) {
        updateFields.push(`email = $${paramIndex++}`);
        values.push(profile.email);
      }
      if (profile.gender) {
        updateFields.push(`gender = $${paramIndex++}`);
        values.push(profile.gender);
      }
      if (profile.age) {
        updateFields.push(`age = $${paramIndex++}`);
        values.push(profile.age);
      }
      if (profile.experience) {
        updateFields.push(`experience = $${paramIndex++}`);
        values.push(profile.experience);
      }
      if (profile.avatar) {
        updateFields.push(`avatar = $${paramIndex++}`);
        values.push(profile.avatar);
      }
      if (profile.bio) {
        updateFields.push(`bio = $${paramIndex++}`);
        values.push(profile.bio);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(userId);

      await this.db.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `, values);

      // 更新偏好设置
      if (profile.preferences) {
        await this.db.query(`
          INSERT INTO user_preferences (user_id, preferences, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id) 
          DO UPDATE SET preferences = $2, updated_at = NOW()
        `, [userId, JSON.stringify(profile.preferences)]);
      }

      return true;
    } catch (error) {
      console.error('Update user profile error:', error);
      return false;
    }
  }

  // 获取用户安全偏好
  async getUserSafetyPreferences(userId: string): Promise<any> {
    try {
      const result = await this.db.query(`
        SELECT preferences FROM user_safety_preferences WHERE user_id = $1
      `, [userId]);

      if (result.length === 0) {
        return this.getDefaultSafetyPreferences();
      }

      return JSON.parse(result[0].preferences);
    } catch (error) {
      console.error('Get user safety preferences error:', error);
      return this.getDefaultSafetyPreferences();
    }
  }

  // 更新用户安全偏好
  async updateUserSafetyPreferences(userId: string, preferences: any): Promise<boolean> {
    try {
      await this.db.query(`
        INSERT INTO user_safety_preferences (user_id, preferences, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET preferences = $2, updated_at = NOW()
      `, [userId, JSON.stringify(preferences)]);

      return true;
    } catch (error) {
      console.error('Update user safety preferences error:', error);
      return false;
    }
  }

  // 获取用户跑步历史
  async getUserRunningHistory(userId: string, limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const activities = await this.db.query(`
        SELECT * FROM running_activities 
        WHERE user_id = $1 
        ORDER BY start_time DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      const total = await this.db.query(`
        SELECT COUNT(*) as count FROM running_activities WHERE user_id = $1
      `, [userId]);

      return {
        activities: activities.map(this.mapRunningActivity),
        total: total[0].count,
        limit,
        offset
      };
    } catch (error) {
      console.error('Get user running history error:', error);
      throw error;
    }
  }

  // 记录跑步活动
  async recordRunningActivity(activity: RunningActivity): Promise<RunningActivity> {
    try {
      const result = await this.db.query(`
        INSERT INTO running_activities (
          user_id, route_name, route_points, distance, duration, 
          start_time, end_time, average_speed, calories, safety_score, 
          weather, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        activity.userId,
        activity.route.name,
        JSON.stringify(activity.route.points),
        activity.route.distance,
        activity.route.duration,
        activity.startTime,
        activity.endTime,
        activity.averageSpeed,
        activity.calories,
        activity.safetyScore,
        JSON.stringify(activity.weather),
        activity.notes
      ]);

      return this.mapRunningActivity(result[0]);
    } catch (error) {
      console.error('Record running activity error:', error);
      throw error;
    }
  }

  // 获取用户统计数据
  async getUserStats(userId: string, period: string = '30d'): Promise<UserStats> {
    try {
      const days = this.parsePeriod(period);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // 获取基础统计
      const basicStats = await this.db.query(`
        SELECT 
          COUNT(*) as total_runs,
          COALESCE(SUM(distance), 0) as total_distance,
          COALESCE(SUM(duration), 0) as total_duration,
          COALESCE(AVG(average_speed), 0) as average_speed,
          COALESCE(AVG(safety_score), 0) as average_safety_score
        FROM running_activities 
        WHERE user_id = $1 AND start_time >= $2
      `, [userId, startDate.toISOString()]);

      // 获取最喜欢的路线
      const favoriteRoutes = await this.db.query(`
        SELECT 
          route_name as name,
          COUNT(*) as count,
          AVG(duration) as average_time
        FROM running_activities 
        WHERE user_id = $1 AND start_time >= $2
        GROUP BY route_name
        ORDER BY count DESC
        LIMIT 5
      `, [userId, startDate.toISOString()]);

      // 获取周统计
      const weeklyStats = await this.db.query(`
        SELECT 
          DATE_TRUNC('week', start_time) as week,
          COUNT(*) as runs,
          SUM(distance) as distance,
          SUM(duration) as duration
        FROM running_activities 
        WHERE user_id = $1 AND start_time >= $2
        GROUP BY DATE_TRUNC('week', start_time)
        ORDER BY week DESC
      `, [userId, startDate.toISOString()]);

      // 获取成就
      const achievements = await this.getUserAchievements(userId);

      const stats = basicStats[0];
      return {
        totalRuns: parseInt(stats.total_runs),
        totalDistance: parseFloat(stats.total_distance) || 0,
        totalDuration: parseFloat(stats.total_duration) || 0,
        averageSpeed: parseFloat(stats.average_speed) || 0,
        averageSafetyScore: parseFloat(stats.average_safety_score) || 0,
        favoriteRoutes: favoriteRoutes.map(route => ({
          name: route.name,
          count: parseInt(route.count),
          averageTime: parseFloat(route.average_time) || 0
        })),
        weeklyStats: weeklyStats.map(week => ({
          week: week.week,
          runs: parseInt(week.runs),
          distance: parseFloat(week.distance) || 0,
          duration: parseFloat(week.duration) || 0
        })),
        achievements
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  // 获取用户成就
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const userAchievements = await this.db.query(`
        SELECT a.*, ua.unlocked_at, ua.progress
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
        ORDER BY ua.unlocked_at DESC NULLS LAST, a.category, a.name
      `, [userId]);

      return userAchievements.map(this.mapAchievement);
    } catch (error) {
      console.error('Get user achievements error:', error);
      return this.getDefaultAchievements();
    }
  }

  // 获取跑步伙伴
  async getRunningBuddies(userId: string, location: string, radius: number = 5000): Promise<RunningBuddy[]> {
    try {
      const [lng, lat] = location.split(',').map(Number);
      
      const buddies = await this.db.query(`
        SELECT 
          u.*,
          ul.lng, ul.lat, ul.address,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(ul.lng, ul.lat), 4326),
            ST_SetSRID(ST_MakePoint($2, $3), 4326)
          ) as distance,
          CASE 
            WHEN ul.updated_at > NOW() - INTERVAL '5 minutes' THEN true 
            ELSE false 
          END as is_online
        FROM users u
        JOIN user_locations ul ON u.id = ul.user_id
        WHERE u.id != $1
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(ul.lng, ul.lat), 4326),
          ST_SetSRID(ST_MakePoint($2, $3), 4326),
          $4
        )
        ORDER BY distance
        LIMIT 20
      `, [userId, lng, lat, radius]);

      return buddies.map(this.mapRunningBuddy);
    } catch (error) {
      console.error('Get running buddies error:', error);
      return this.getMockRunningBuddies();
    }
  }

  // 发送跑步邀请
  async sendRunningInvitation(invitation: Omit<RunningInvitation, 'id' | 'status' | 'createdAt'>): Promise<RunningInvitation> {
    try {
      const result = await this.db.query(`
        INSERT INTO running_invitations (
          from_user_id, to_user_id, scheduled_time, route_name, 
          route_distance, route_duration, message, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING *
      `, [
        invitation.fromUserId,
        invitation.toUserId,
        invitation.scheduledTime,
        invitation.route.name,
        invitation.route.distance,
        invitation.route.estimatedDuration,
        invitation.message
      ]);

      return this.mapRunningInvitation(result[0]);
    } catch (error) {
      console.error('Send running invitation error:', error);
      throw error;
    }
  }

  // 响应跑步邀请
  async respondToRunningInvitation(invitationId: string, userId: string, response: 'accepted' | 'declined'): Promise<boolean> {
    try {
      const result = await this.db.query(`
        UPDATE running_invitations 
        SET status = $1, responded_at = NOW()
        WHERE id = $2 AND to_user_id = $3 AND status = 'pending'
        RETURNING *
      `, [response, invitationId, userId]);

      return result.length > 0;
    } catch (error) {
      console.error('Respond to running invitation error:', error);
      return false;
    }
  }

  // 获取用户邀请
  async getUserInvitations(userId: string, type: string = 'all', status: string = 'all'): Promise<any> {
    try {
      let query = `
        SELECT ri.*, 
               fu.username as from_username, fu.avatar as from_avatar,
               tu.username as to_username, tu.avatar as to_avatar
        FROM running_invitations ri
        JOIN users fu ON ri.from_user_id = fu.id
        JOIN users tu ON ri.to_user_id = tu.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (type === 'sent') {
        query += ` AND ri.from_user_id = $${paramIndex++}`;
        params.push(userId);
      } else if (type === 'received') {
        query += ` AND ri.to_user_id = $${paramIndex++}`;
        params.push(userId);
      } else {
        query += ` AND (ri.from_user_id = $${paramIndex++} OR ri.to_user_id = $${paramIndex++})`;
        params.push(userId, userId);
      }

      if (status !== 'all') {
        query += ` AND ri.status = $${paramIndex++}`;
        params.push(status);
      }

      query += ` ORDER BY ri.created_at DESC`;

      const invitations = await this.db.query(query, params);
      return {
        invitations: invitations.map(this.mapRunningInvitation)
      };
    } catch (error) {
      console.error('Get user invitations error:', error);
      throw error;
    }
  }

  // 更新用户位置
  async updateUserLocation(userId: string, location: { lng: number; lat: number; address?: string }): Promise<boolean> {
    try {
      await this.db.query(`
        INSERT INTO user_locations (user_id, lng, lat, address, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET lng = $2, lat = $3, address = $4, updated_at = NOW()
      `, [userId, location.lng, location.lat, location.address]);

      return true;
    } catch (error) {
      console.error('Update user location error:', error);
      return false;
    }
  }

  // 获取用户通知设置
  async getUserNotificationSettings(userId: string): Promise<any> {
    try {
      const result = await this.db.query(`
        SELECT settings FROM user_notification_settings WHERE user_id = $1
      `, [userId]);

      if (result.length === 0) {
        return this.getDefaultNotificationSettings();
      }

      return JSON.parse(result[0].settings);
    } catch (error) {
      console.error('Get user notification settings error:', error);
      return this.getDefaultNotificationSettings();
    }
  }

  // 更新用户通知设置
  async updateUserNotificationSettings(userId: string, settings: any): Promise<boolean> {
    try {
      await this.db.query(`
        INSERT INTO user_notification_settings (user_id, settings, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET settings = $2, updated_at = NOW()
      `, [userId, JSON.stringify(settings)]);

      return true;
    } catch (error) {
      console.error('Update user notification settings error:', error);
      return false;
    }
  }

  // 私有辅助方法
  private parsePeriod(period: string): number {
    const match = period.match(/(\d+)([dwmy])/);
    if (!match) return 30;

    const [, num, unit] = match;
    const value = parseInt(num);

    switch (unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      default: return 30;
    }
  }

  // 数据映射方法
  private mapUserProfile(row: any): UserProfile {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      gender: row.gender,
      age: row.age,
      experience: row.experience,
      avatar: row.avatar,
      bio: row.bio,
      location: row.lng && row.lat ? {
        lng: row.lng,
        lat: row.lat,
        address: row.address
      } : undefined,
      preferences: row.preferences ? JSON.parse(row.preferences) : this.getDefaultPreferences(),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRunningActivity(row: any): RunningActivity {
    return {
      id: row.id,
      userId: row.user_id,
      route: {
        name: row.route_name,
        points: JSON.parse(row.route_points || '[]'),
        distance: row.distance,
        duration: row.duration
      },
      startTime: row.start_time,
      endTime: row.end_time,
      averageSpeed: row.average_speed,
      calories: row.calories,
      safetyScore: row.safety_score,
      weather: row.weather ? JSON.parse(row.weather) : undefined,
      notes: row.notes
    };
  }

  private mapRunningBuddy(row: any): RunningBuddy {
    return {
      id: row.id,
      username: row.username,
      avatar: row.avatar,
      gender: row.gender,
      age: row.age,
      experience: row.experience,
      location: {
        lng: row.lng,
        lat: row.lat,
        address: row.address
      },
      distance: Math.round(row.distance || 0),
      safetyScore: 75 + Math.random() * 20, // 模拟安全评分
      preferences: {
        preferredDistance: 3000 + Math.random() * 5000,
        preferredTime: ['morning', 'evening']
      },
      isOnline: row.is_online,
      lastActive: row.updated_at
    };
  }

  private mapRunningInvitation(row: any): RunningInvitation {
    return {
      id: row.id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      fromUser: {
        username: row.from_username,
        avatar: row.from_avatar
      },
      toUser: {
        username: row.to_username,
        avatar: row.to_avatar
      },
      scheduledTime: row.scheduled_time,
      route: {
        name: row.route_name,
        distance: row.route_distance,
        estimatedDuration: row.route_duration
      },
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      respondedAt: row.responded_at
    };
  }

  private mapAchievement(row: any): Achievement {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      category: row.category,
      unlockedAt: row.unlocked_at,
      progress: row.progress ? JSON.parse(row.progress) : undefined
    };
  }

  // 默认数据方法
  private getDefaultPreferences() {
    return {
      preferredDistance: 5000,
      preferredTime: ['morning', 'evening'],
      safetyLevel: 'medium',
      notifications: {
        emergency: true,
        buddy: true,
        safety: true
      }
    };
  }

  private getDefaultSafetyPreferences() {
    return {
      enableRealTimeTracking: true,
      shareLocationWithContacts: true,
      enableEmergencyAlerts: true,
      preferWellLitRoutes: true,
      avoidIsolatedAreas: true,
      minimumSafetyScore: 70
    };
  }

  private getDefaultNotificationSettings() {
    return {
      emergency: {
        push: true,
        sms: true,
        email: false
      },
      buddy: {
        push: true,
        sms: false,
        email: false
      },
      safety: {
        push: true,
        sms: false,
        email: false
      },
      marketing: {
        push: false,
        sms: false,
        email: false
      }
    };
  }

  private getDefaultAchievements(): Achievement[] {
    return [
      {
        id: 'first-run',
        name: '首次跑步',
        description: '完成第一次跑步记录',
        icon: '🏃',
        category: 'distance',
        progress: { current: 0, target: 1 }
      },
      {
        id: 'safety-champion',
        name: '安全卫士',
        description: '连续10次跑步安全评分超过80分',
        icon: '🛡️',
        category: 'safety',
        progress: { current: 0, target: 10 }
      },
      {
        id: 'social-runner',
        name: '社交达人',
        description: '与5位不同的跑友一起跑步',
        icon: '👥',
        category: 'social',
        progress: { current: 0, target: 5 }
      }
    ];
  }

  private getMockRunningBuddies(): RunningBuddy[] {
    return [
      {
        id: 'buddy-001',
        username: '小雨',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20woman%20runner%20avatar&image_size=square',
        gender: 'female',
        age: 28,
        experience: 'intermediate',
        location: {
          lng: 121.4737,
          lat: 31.2304,
          address: '黄浦区'
        },
        distance: 800,
        safetyScore: 92,
        preferences: {
          preferredDistance: 5000,
          preferredTime: ['morning', 'evening']
        },
        isOnline: true,
        lastActive: new Date().toISOString()
      },
      {
        id: 'buddy-002',
        username: '健康小王',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20man%20runner%20avatar&image_size=square',
        gender: 'male',
        age: 32,
        experience: 'advanced',
        location: {
          lng: 121.4837,
          lat: 31.2404,
          address: '静安区'
        },
        distance: 1200,
        safetyScore: 88,
        preferences: {
          preferredDistance: 8000,
          preferredTime: ['morning']
        },
        isOnline: false,
        lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ];
  }
}