import { Server, Socket } from 'socket.io';

interface LocationUpdate {
  userId: string;
  lng: number;
  lat: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
}

interface EmergencyAlert {
  userId: string;
  type: 'sos' | 'medical' | 'accident' | 'harassment' | 'suspicious';
  lng: number;
  lat: number;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface BuddyRequest {
  fromUserId: string;
  toUserId: string;
  scheduledTime: string;
  routeName: string;
  routeDistance: number;
  routeDuration: number;
  message?: string;
}

interface SafetyNotification {
  type: 'risk_alert' | 'route_warning' | 'weather_alert' | 'area_warning';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  lng?: number;
  lat?: number;
  radius?: number;
}

// 存储用户连接
const userConnections = new Map<string, Socket>();
const userLocations = new Map<string, LocationUpdate>();

export function setupWebSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // 用户认证和注册
    socket.on('user:register', (data: { userId: string }) => {
      const { userId } = data;
      userConnections.set(userId, socket);
      socket.userId = userId;
      
      console.log(`User ${userId} registered with socket ${socket.id}`);
      
      // 发送连接确认
      socket.emit('connection:confirmed', {
        userId,
        timestamp: new Date().toISOString()
      });
    });

    // 位置更新处理
    socket.on('location:update', (data: LocationUpdate) => {
      try {
        const { userId, lng, lat, timestamp, accuracy, speed } = data;
        
        // 存储用户位置
        userLocations.set(userId, data);
        
        // 广播位置更新给相关用户（跑友、紧急联系人等）
        socket.broadcast.emit('location:updated', {
          userId,
          lng,
          lat,
          timestamp,
          accuracy,
          speed
        });

        // 检查是否进入危险区域
        checkSafetyZones(userId, lng, lat, socket);
        
        console.log(`Location updated for user ${userId}: ${lat}, ${lng}`);
      } catch (error) {
        console.error('Error handling location update:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // 紧急求救处理
    socket.on('emergency:alert', (data: EmergencyAlert) => {
      try {
        const { userId, type, lng, lat, description, severity, timestamp } = data;
        
        console.log(`Emergency alert from user ${userId}: ${type} at ${lat}, ${lng}`);
        
        // 广播紧急警报给所有连接的用户
        io.emit('emergency:received', {
          alertId: generateAlertId(),
          userId,
          type,
          lng,
          lat,
          description,
          severity,
          timestamp,
          status: 'received'
        });

        // 通知附近的用户
        notifyNearbyUsers(lng, lat, {
          type: 'area_warning',
          title: '附近紧急情况',
          message: `${getEmergencyTypeText(type)}，请注意安全`,
          severity: 'danger',
          lng,
          lat,
          radius: 1000
        });

        // 发送确认给报警用户
        socket.emit('emergency:confirmed', {
          alertId: generateAlertId(),
          timestamp: new Date().toISOString(),
          message: '紧急求救已发送，救援人员正在赶来'
        });

      } catch (error) {
        console.error('Error handling emergency alert:', error);
        socket.emit('error', { message: 'Failed to send emergency alert' });
      }
    });

    // 跑友邀请处理
    socket.on('buddy:request', (data: BuddyRequest) => {
      try {
        const { fromUserId, toUserId, scheduledTime, routeName, routeDistance, routeDuration, message } = data;
        
        const targetSocket = userConnections.get(toUserId);
        if (targetSocket) {
          targetSocket.emit('buddy:invitation', {
            invitationId: generateInvitationId(),
            fromUserId,
            scheduledTime,
            routeName,
            routeDistance,
            routeDuration,
            message,
            timestamp: new Date().toISOString()
          });
          
          socket.emit('buddy:request_sent', {
            toUserId,
            timestamp: new Date().toISOString()
          });
        } else {
          socket.emit('buddy:user_offline', {
            toUserId,
            message: '用户当前不在线，邀请将通过其他方式发送'
          });
        }
        
        console.log(`Buddy request from ${fromUserId} to ${toUserId}`);
      } catch (error) {
        console.error('Error handling buddy request:', error);
        socket.emit('error', { message: 'Failed to send buddy request' });
      }
    });

    // 跑友邀请响应
    socket.on('buddy:response', (data: { invitationId: string; response: 'accepted' | 'declined'; fromUserId: string }) => {
      try {
        const { invitationId, response, fromUserId } = data;
        
        const targetSocket = userConnections.get(fromUserId);
        if (targetSocket) {
          targetSocket.emit('buddy:response_received', {
            invitationId,
            response,
            responderId: socket.userId,
            timestamp: new Date().toISOString()
          });
        }
        
        console.log(`Buddy invitation ${invitationId} ${response} by ${socket.userId}`);
      } catch (error) {
        console.error('Error handling buddy response:', error);
        socket.emit('error', { message: 'Failed to respond to buddy request' });
      }
    });

    // 安全通知处理
    socket.on('safety:notification', (data: SafetyNotification) => {
      try {
        // 根据位置和半径广播安全通知
        if (data.lng && data.lat && data.radius) {
          notifyNearbyUsers(data.lng, data.lat, data);
        } else {
          // 广播给所有用户
          io.emit('safety:alert', data);
        }
        
        console.log(`Safety notification sent: ${data.type} - ${data.title}`);
      } catch (error) {
        console.error('Error handling safety notification:', error);
        socket.emit('error', { message: 'Failed to send safety notification' });
      }
    });

    // 心跳检测
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // 断开连接处理
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      
      if (socket.userId) {
        userConnections.delete(socket.userId);
        userLocations.delete(socket.userId);
        
        // 通知其他用户该用户已离线
        socket.broadcast.emit('user:offline', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    });

    // 错误处理
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
}

// 检查安全区域
function checkSafetyZones(userId: string, lng: number, lat: number, socket: Socket): void {
  // 模拟危险区域检查
  const dangerousZones = [
    { lng: 121.4444, lat: 31.2396, radius: 200, type: 'crime' },
    { lng: 121.4737, lat: 31.2304, radius: 100, type: 'lighting' }
  ];

  for (const zone of dangerousZones) {
    const distance = calculateDistance(lng, lat, zone.lng, zone.lat);
    if (distance <= zone.radius) {
      socket.emit('safety:zone_warning', {
        type: 'danger_zone_entered',
        title: '进入危险区域',
        message: `您已进入${zone.type === 'crime' ? '犯罪高发' : '照明不足'}区域，请提高警惕`,
        severity: 'warning',
        lng: zone.lng,
        lat: zone.lat,
        radius: zone.radius
      });
    }
  }
}

// 通知附近用户
function notifyNearbyUsers(lng: number, lat: number, notification: SafetyNotification): void {
  const radius = notification.radius || 1000; // 默认1公里

  userLocations.forEach((location, userId) => {
    const distance = calculateDistance(lng, lat, location.lng, location.lat);
    if (distance <= radius) {
      const socket = userConnections.get(userId);
      if (socket) {
        socket.emit('safety:alert', notification);
      }
    }
  });
}

// 计算两点间距离（米）
function calculateDistance(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371e3; // 地球半径（米）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// 生成唯一ID
function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateInvitationId(): string {
  return `invitation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 获取紧急类型文本
function getEmergencyTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    sos: '紧急求救',
    medical: '医疗急救',
    accident: '意外事故',
    harassment: '骚扰事件',
    suspicious: '可疑情况'
  };
  return typeMap[type] || '紧急情况';
}

// 扩展Socket接口以包含userId
declare module 'socket.io' {
  interface Socket {
    userId?: string;
  }
}