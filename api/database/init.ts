import { Database } from './Database';

export async function initializeDatabase(): Promise<void> {
  const db = new Database();

  try {
    console.log('Initializing database...');

    // 检查连接
    const isConnected = await db.checkConnection();
    if (!isConnected) {
      console.log('Database connection failed, using mock data mode');
      return;
    }

    // 创建扩展
    await db.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    
    // 创建用户表
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
        age INTEGER CHECK (age > 0 AND age < 150),
        experience VARCHAR(20) CHECK (experience IN ('beginner', 'intermediate', 'advanced')),
        avatar TEXT,
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建用户偏好表
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        preferences JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建用户位置表
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_locations (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        lng DECIMAL(10, 7) NOT NULL,
        lat DECIMAL(10, 7) NOT NULL,
        address TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建用户安全偏好表
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_safety_preferences (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        preferences JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建用户通知设置表
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_notification_settings (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        settings JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建跑步活动表
    await db.query(`
      CREATE TABLE IF NOT EXISTS running_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        route_name VARCHAR(100) NOT NULL,
        route_points JSONB NOT NULL,
        distance INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        average_speed DECIMAL(5, 2) NOT NULL,
        calories INTEGER,
        safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
        weather JSONB,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建跑步邀请表
    await db.query(`
      CREATE TABLE IF NOT EXISTS running_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
        route_name VARCHAR(100) NOT NULL,
        route_distance INTEGER NOT NULL,
        route_duration INTEGER NOT NULL,
        message TEXT,
        status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        responded_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // 创建安全事件表
    await db.query(`
      CREATE TABLE IF NOT EXISTS safety_incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        lng DECIMAL(10, 7) NOT NULL,
        lat DECIMAL(10, 7) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        description TEXT,
        reported_by VARCHAR(100),
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建风险热点表
    await db.query(`
      CREATE TABLE IF NOT EXISTS risk_hotspots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lng DECIMAL(10, 7) NOT NULL,
        lat DECIMAL(10, 7) NOT NULL,
        type VARCHAR(50) CHECK (type IN ('crime', 'accident', 'lighting', 'crowd', 'weather')),
        level VARCHAR(20) CHECK (level IN ('low', 'medium', 'high', 'critical')),
        description TEXT NOT NULL,
        radius INTEGER NOT NULL,
        reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        verified_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建紧急报告表
    await db.query(`
      CREATE TABLE IF NOT EXISTS emergency_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) CHECK (type IN ('sos', 'medical', 'accident', 'harassment', 'suspicious')),
        lng DECIMAL(10, 7) NOT NULL,
        lat DECIMAL(10, 7) NOT NULL,
        description TEXT,
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) CHECK (status IN ('received', 'processing', 'dispatched', 'resolved', 'cancelled')) DEFAULT 'received',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建紧急报告更新表
    await db.query(`
      CREATE TABLE IF NOT EXISTS emergency_report_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        notes TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建紧急联系人表
    await db.query(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        type VARCHAR(20) CHECK (type IN ('police', 'medical', 'fire', 'personal')),
        lng DECIMAL(10, 7),
        lat DECIMAL(10, 7),
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建个人紧急联系人表
    await db.query(`
      CREATE TABLE IF NOT EXISTS personal_emergency_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        relationship VARCHAR(50),
        priority INTEGER DEFAULT 1,
        notify_on_emergency BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建紧急通知表
    await db.query(`
      CREATE TABLE IF NOT EXISTS emergency_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
        contact_id UUID,
        contact_type VARCHAR(20) CHECK (contact_type IN ('personal', 'service')),
        service_type VARCHAR(20),
        status VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'failed')) DEFAULT 'sent',
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建女性安全功能表
    await db.query(`
      CREATE TABLE IF NOT EXISTS women_safety_features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        category VARCHAR(50) CHECK (category IN ('tracking', 'communication', 'route', 'emergency')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建成就表
    await db.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(10),
        category VARCHAR(50) CHECK (category IN ('distance', 'frequency', 'safety', 'social')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建用户成就表
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        progress JSONB,
        UNIQUE(user_id, achievement_id)
      );
    `);

    // 创建索引
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_locations_point ON user_locations USING GIST (ST_Point(lng, lat));`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_safety_incidents_point ON safety_incidents USING GIST (ST_Point(lng, lat));`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_risk_hotspots_point ON risk_hotspots USING GIST (ST_Point(lng, lat));`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_emergency_reports_point ON emergency_reports USING GIST (ST_Point(lng, lat));`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_emergency_contacts_point ON emergency_contacts USING GIST (ST_Point(lng, lat));`);
    
    await db.query(`CREATE INDEX IF NOT EXISTS idx_running_activities_user_time ON running_activities (user_id, start_time);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_running_invitations_users ON running_invitations (from_user_id, to_user_id, status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_emergency_reports_user_time ON emergency_reports (user_id, timestamp);`);

    // 插入初始数据
    await insertInitialData(db);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function insertInitialData(db: Database): Promise<void> {
  try {
    // 插入紧急联系人数据
    await db.query(`
      INSERT INTO emergency_contacts (name, phone, type, lng, lat, address) VALUES
      ('黄浦区派出所', '021-23456789', 'police', 121.4737, 31.2304, '上海市黄浦区南京东路100号'),
      ('静安区派出所', '021-34567890', 'police', 121.4444, 31.2396, '上海市静安区南京西路200号'),
      ('瑞金医院急诊科', '021-64370045', 'medical', 121.4692, 31.2135, '上海市黄浦区瑞金二路197号'),
      ('华山医院急诊科', '021-52889999', 'medical', 121.4368, 31.2099, '上海市静安区乌鲁木齐中路12号'),
      ('黄浦消防救援站', '119', 'fire', 121.4837, 31.2204, '上海市黄浦区中山南路300号'),
      ('静安消防救援站', '119', 'fire', 121.4544, 31.2496, '上海市静安区江宁路400号')
      ON CONFLICT DO NOTHING;
    `);

    // 插入女性安全功能数据
    await db.query(`
      INSERT INTO women_safety_features (name, description, category) VALUES
      ('实时位置追踪', '向信任联系人实时分享位置信息', 'tracking'),
      ('一键紧急求救', '快速发送求救信号给紧急联系人', 'emergency'),
      ('女性专用安全路线', '推荐照明良好、人流密集的安全路线', 'route'),
      ('女性跑友匹配', '匹配附近的女性跑友，结伴跑步', 'communication'),
      ('夜间安全模式', '夜间跑步时自动启用额外安全功能', 'tracking'),
      ('安全区域提醒', '进入或离开安全区域时发送提醒', 'tracking')
      ON CONFLICT DO NOTHING;
    `);

    // 插入成就数据
    await db.query(`
      INSERT INTO achievements (name, description, icon, category) VALUES
      ('首次跑步', '完成第一次跑步记录', '🏃', 'distance'),
      ('安全卫士', '连续10次跑步安全评分超过80分', '🛡️', 'safety'),
      ('社交达人', '与5位不同的跑友一起跑步', '👥', 'social'),
      ('马拉松挑战者', '单次跑步距离超过42公里', '🏆', 'distance'),
      ('早起鸟', '连续7天早晨6点前开始跑步', '🌅', 'frequency'),
      ('夜猫子', '连续5次夜间跑步且安全评分超过85分', '🌙', 'safety'),
      ('路线探索者', '跑过10条不同的路线', '🗺️', 'distance'),
      ('安全大使', '帮助其他跑友提高安全意识', '🎖️', 'social')
      ON CONFLICT DO NOTHING;
    `);

    // 插入风险热点示例数据
    await db.query(`
      INSERT INTO risk_hotspots (lng, lat, type, level, description, radius) VALUES
      (121.4737, 31.2304, 'lighting', 'medium', '夜间照明不足，建议避免夜跑', 100),
      (121.4444, 31.2396, 'crime', 'high', '近期有盗窃案件报告，请提高警惕', 200),
      (121.4692, 31.2135, 'crowd', 'low', '人流密集区域，注意避让行人', 150),
      (121.4368, 31.2099, 'accident', 'medium', '路面不平，注意脚下安全', 80)
      ON CONFLICT DO NOTHING;
    `);

    console.log('Initial data inserted successfully');
  } catch (error) {
    console.error('Failed to insert initial data:', error);
    // 不抛出错误，允许系统在没有初始数据的情况下运行
  }
}