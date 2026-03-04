import { Database } from '../database/Database';

export interface LocationData {
  lng: number;
  lat: number;
  accuracy?: number;
  timestamp: number;
}

export interface EmergencyReportRequest {
  type: 'sos' | 'medical' | 'accident' | 'harassment' | 'suspicious';
  location: LocationData;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  timestamp: number;
}

export interface EmergencyReportResponse {
  reportId: string;
  status: 'received' | 'processing' | 'dispatched' | 'resolved';
  estimatedResponseTime?: number;
  assignedContacts: EmergencyContact[];
  instructions: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'police' | 'medical' | 'fire' | 'personal';
  location?: LocationData;
  distance?: number;
}

export interface EmergencyIncident {
  id: string;
  type: string;
  location: LocationData;
  timestamp: string;
  severity: string;
  description: string;
  reportedBy: string;
  status: string;
  resolved: boolean;
}

export interface PersonalEmergencyContact {
  id?: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  notifyOnEmergency: boolean;
}

export class EmergencyService {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  // 报告紧急情况
  async reportEmergency(request: EmergencyReportRequest): Promise<EmergencyReportResponse> {
    try {
      // 插入紧急报告
      const reportResult = await this.db.query(`
        INSERT INTO emergency_reports (type, lng, lat, description, severity, user_id, timestamp, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'received')
        RETURNING id
      `, [
        request.type,
        request.location.lng,
        request.location.lat,
        request.description,
        request.severity,
        request.userId,
        new Date(request.timestamp).toISOString()
      ]);

      const reportId = `EMG-${reportResult[0].id}`;

      // 获取附近的紧急联系人
      const assignedContacts = await this.getNearbyEmergencyContacts(request.location, 5000);

      // 根据紧急类型和严重程度估算响应时间
      const estimatedResponseTime = this.calculateResponseTime(request.type, request.severity);

      // 生成应急指导
      const instructions = this.generateEmergencyInstructions(request.type, request.severity);

      // 通知个人紧急联系人
      await this.notifyPersonalContacts(request.userId, reportId, request);

      // 如果是SOS或高严重级别，立即通知相关部门
      if (request.type === 'sos' || request.severity === 'critical') {
        await this.notifyEmergencyServices(reportId, request);
      }

      return {
        reportId,
        status: 'received',
        estimatedResponseTime,
        assignedContacts,
        instructions
      };
    } catch (error) {
      console.error('Report emergency error:', error);
      throw error;
    }
  }

  // 获取附近紧急联系人
  async getNearbyEmergencyContacts(location: LocationData, radius: number = 5000): Promise<EmergencyContact[]> {
    try {
      const contacts = await this.db.query(`
        SELECT *, 
               ST_Distance(
                 ST_SetSRID(ST_MakePoint(lng, lat), 4326),
                 ST_SetSRID(ST_MakePoint($1, $2), 4326)
               ) as distance
        FROM emergency_contacts 
        WHERE ST_DWithin(
          ST_SetSRID(ST_MakePoint(lng, lat), 4326),
          ST_SetSRID(ST_MakePoint($1, $2), 4326),
          $3
        )
        ORDER BY type, distance
      `, [location.lng, location.lat, radius]);

      return contacts.map(this.mapEmergencyContact);
    } catch (error) {
      console.error('Get nearby emergency contacts error:', error);
      return this.getMockEmergencyContacts(location);
    }
  }

  // 获取紧急报告状态
  async getEmergencyReportStatus(reportId: string): Promise<any> {
    try {
      const result = await this.db.query(`
        SELECT * FROM emergency_reports WHERE id = $1
      `, [reportId.replace('EMG-', '')]);

      if (result.length === 0) {
        throw new Error('Emergency report not found');
      }

      const report = result[0];
      return {
        reportId,
        status: report.status,
        type: report.type,
        severity: report.severity,
        timestamp: report.timestamp,
        location: {
          lng: report.lng,
          lat: report.lat
        },
        description: report.description,
        updates: await this.getReportUpdates(reportId)
      };
    } catch (error) {
      console.error('Get emergency report status error:', error);
      throw error;
    }
  }

  // 更新紧急报告状态
  async updateEmergencyReportStatus(reportId: string, status: string, notes?: string): Promise<boolean> {
    try {
      await this.db.query(`
        UPDATE emergency_reports 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
      `, [status, reportId.replace('EMG-', '')]);

      // 记录状态更新
      if (notes) {
        await this.db.query(`
          INSERT INTO emergency_report_updates (report_id, status, notes, timestamp)
          VALUES ($1, $2, $3, NOW())
        `, [reportId.replace('EMG-', ''), status, notes]);
      }

      return true;
    } catch (error) {
      console.error('Update emergency report status error:', error);
      return false;
    }
  }

  // 获取用户紧急报告历史
  async getUserEmergencyHistory(userId: string, limit: number = 10, offset: number = 0): Promise<any> {
    try {
      const reports = await this.db.query(`
        SELECT * FROM emergency_reports 
        WHERE user_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      const total = await this.db.query(`
        SELECT COUNT(*) as count FROM emergency_reports WHERE user_id = $1
      `, [userId]);

      return {
        reports: reports.map(this.mapEmergencyReport),
        total: total[0].count,
        limit,
        offset
      };
    } catch (error) {
      console.error('Get user emergency history error:', error);
      throw error;
    }
  }

  // SOS 快速报警
  async triggerSOS(userId: string, location: LocationData): Promise<EmergencyReportResponse> {
    const sosRequest: EmergencyReportRequest = {
      type: 'sos',
      location,
      description: 'SOS紧急求救',
      severity: 'critical',
      userId,
      timestamp: Date.now()
    };

    return await this.reportEmergency(sosRequest);
  }

  // 取消紧急报告
  async cancelEmergencyReport(reportId: string, userId: string, reason?: string): Promise<boolean> {
    try {
      // 验证报告属于该用户
      const report = await this.db.query(`
        SELECT user_id FROM emergency_reports WHERE id = $1
      `, [reportId.replace('EMG-', '')]);

      if (report.length === 0 || report[0].user_id !== userId) {
        throw new Error('Unauthorized or report not found');
      }

      // 更新状态为已取消
      await this.db.query(`
        UPDATE emergency_reports 
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1
      `, [reportId.replace('EMG-', '')]);

      // 记录取消原因
      if (reason) {
        await this.db.query(`
          INSERT INTO emergency_report_updates (report_id, status, notes, timestamp)
          VALUES ($1, 'cancelled', $2, NOW())
        `, [reportId.replace('EMG-', ''), reason]);
      }

      return true;
    } catch (error) {
      console.error('Cancel emergency report error:', error);
      return false;
    }
  }

  // 获取附近的紧急事件
  async getNearbyEmergencyIncidents(location: LocationData, radius: number = 2000, timeRange?: { start: string; end: string }): Promise<EmergencyIncident[]> {
    try {
      let query = `
        SELECT * FROM emergency_reports 
        WHERE ST_DWithin(
          ST_SetSRID(ST_MakePoint(lng, lat), 4326),
          ST_SetSRID(ST_MakePoint($1, $2), 4326),
          $3
        )
        AND status != 'cancelled'
      `;
      
      const params: any[] = [location.lng, location.lat, radius];

      if (timeRange) {
        query += ` AND timestamp BETWEEN $4 AND $5`;
        params.push(new Date(timeRange.start).toISOString(), new Date(timeRange.end).toISOString());
      } else {
        // 默认显示最近24小时的事件
        query += ` AND timestamp > NOW() - INTERVAL '24 hours'`;
      }

      query += ` ORDER BY timestamp DESC`;

      const incidents = await this.db.query(query, params);
      return incidents.map(this.mapEmergencyIncident);
    } catch (error) {
      console.error('Get nearby emergency incidents error:', error);
      return [];
    }
  }

  // 设置个人紧急联系人
  async setPersonalEmergencyContacts(userId: string, contacts: PersonalEmergencyContact[]): Promise<boolean> {
    try {
      // 删除现有联系人
      await this.db.query(`DELETE FROM personal_emergency_contacts WHERE user_id = $1`, [userId]);

      // 插入新联系人
      for (const contact of contacts) {
        await this.db.query(`
          INSERT INTO personal_emergency_contacts (user_id, name, phone, relationship, priority, notify_on_emergency)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [userId, contact.name, contact.phone, contact.relationship, contact.priority, contact.notifyOnEmergency]);
      }

      return true;
    } catch (error) {
      console.error('Set personal emergency contacts error:', error);
      return false;
    }
  }

  // 获取个人紧急联系人
  async getPersonalEmergencyContacts(userId: string): Promise<PersonalEmergencyContact[]> {
    try {
      const contacts = await this.db.query(`
        SELECT * FROM personal_emergency_contacts 
        WHERE user_id = $1 
        ORDER BY priority
      `, [userId]);

      return contacts.map(this.mapPersonalEmergencyContact);
    } catch (error) {
      console.error('Get personal emergency contacts error:', error);
      return [];
    }
  }

  // 私有辅助方法
  private calculateResponseTime(type: string, severity: string): number {
    const baseTimes = {
      sos: 300,      // 5分钟
      medical: 480,  // 8分钟
      accident: 600, // 10分钟
      harassment: 900, // 15分钟
      suspicious: 1200 // 20分钟
    };

    const severityMultipliers = {
      critical: 0.5,
      high: 0.7,
      medium: 1.0,
      low: 1.5
    };

    const baseTime = baseTimes[type] || 600;
    const multiplier = severityMultipliers[severity] || 1.0;

    return Math.round(baseTime * multiplier);
  }

  private generateEmergencyInstructions(type: string, severity: string): string[] {
    const commonInstructions = [
      '保持冷静，确保自身安全',
      '如果可能，移动到安全区域',
      '保持手机畅通，等待救援人员联系'
    ];

    const typeSpecificInstructions = {
      sos: [
        '立即寻找安全地点',
        '如有可能，向周围人求助',
        '记住周围环境特征'
      ],
      medical: [
        '不要移动伤者（除非有生命危险）',
        '保持伤者呼吸道畅通',
        '如有出血，进行止血处理'
      ],
      accident: [
        '确保现场安全，避免二次事故',
        '如有伤者，立即检查伤情',
        '保护现场，等待专业人员'
      ],
      harassment: [
        '立即离开现场到安全地点',
        '记录骚扰者特征',
        '保存相关证据'
      ],
      suspicious: [
        '保持距离，不要直接接触',
        '记录可疑人员或物品特征',
        '通知周围其他人注意'
      ]
    };

    return [...commonInstructions, ...(typeSpecificInstructions[type] || [])];
  }

  private async notifyPersonalContacts(userId: string, reportId: string, request: EmergencyReportRequest): Promise<void> {
    try {
      const contacts = await this.getPersonalEmergencyContacts(userId);
      const notifyContacts = contacts.filter(c => c.notifyOnEmergency);

      for (const contact of notifyContacts) {
        // 这里应该发送短信或推送通知
        console.log(`Notifying ${contact.name} (${contact.phone}) about emergency ${reportId}`);
        
        // 记录通知
        await this.db.query(`
          INSERT INTO emergency_notifications (report_id, contact_id, contact_type, status, sent_at)
          VALUES ($1, $2, 'personal', 'sent', NOW())
        `, [reportId.replace('EMG-', ''), contact.id]);
      }
    } catch (error) {
      console.error('Notify personal contacts error:', error);
    }
  }

  private async notifyEmergencyServices(reportId: string, request: EmergencyReportRequest): Promise<void> {
    try {
      // 根据紧急类型通知相应服务
      const serviceTypes = {
        sos: ['police'],
        medical: ['medical', 'police'],
        accident: ['medical', 'police'],
        harassment: ['police'],
        suspicious: ['police']
      };

      const services = serviceTypes[request.type] || ['police'];
      
      for (const service of services) {
        console.log(`Notifying ${service} services about emergency ${reportId}`);
        
        // 记录服务通知
        await this.db.query(`
          INSERT INTO emergency_notifications (report_id, contact_type, service_type, status, sent_at)
          VALUES ($1, 'service', $2, 'sent', NOW())
        `, [reportId.replace('EMG-', ''), service]);
      }
    } catch (error) {
      console.error('Notify emergency services error:', error);
    }
  }

  private async getReportUpdates(reportId: string): Promise<any[]> {
    try {
      const updates = await this.db.query(`
        SELECT * FROM emergency_report_updates 
        WHERE report_id = $1 
        ORDER BY timestamp DESC
      `, [reportId.replace('EMG-', '')]);

      return updates;
    } catch (error) {
      console.error('Get report updates error:', error);
      return [];
    }
  }

  // 数据映射方法
  private mapEmergencyContact(row: any): EmergencyContact {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      type: row.type,
      location: row.lng && row.lat ? {
        lng: row.lng,
        lat: row.lat,
        timestamp: Date.now()
      } : undefined,
      distance: row.distance ? Math.round(row.distance) : undefined
    };
  }

  private mapEmergencyReport(row: any): any {
    return {
      id: `EMG-${row.id}`,
      type: row.type,
      location: {
        lng: row.lng,
        lat: row.lat
      },
      timestamp: row.timestamp,
      severity: row.severity,
      description: row.description,
      status: row.status,
      userId: row.user_id
    };
  }

  private mapEmergencyIncident(row: any): EmergencyIncident {
    return {
      id: `EMG-${row.id}`,
      type: row.type,
      location: {
        lng: row.lng,
        lat: row.lat,
        timestamp: new Date(row.timestamp).getTime()
      },
      timestamp: row.timestamp,
      severity: row.severity,
      description: row.description,
      reportedBy: row.user_id,
      status: row.status,
      resolved: row.status === 'resolved'
    };
  }

  private mapPersonalEmergencyContact(row: any): PersonalEmergencyContact {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      phone: row.phone,
      relationship: row.relationship,
      priority: row.priority,
      notifyOnEmergency: row.notify_on_emergency
    };
  }

  // 模拟数据方法
  private getMockEmergencyContacts(location: LocationData): EmergencyContact[] {
    return [
      {
        id: 'police-001',
        name: '黄浦区派出所',
        phone: '021-23456789',
        type: 'police',
        location: {
          lng: location.lng + 0.001,
          lat: location.lat + 0.001,
          timestamp: Date.now()
        },
        distance: 500
      },
      {
        id: 'medical-001',
        name: '瑞金医院急诊科',
        phone: '021-34567890',
        type: 'medical',
        location: {
          lng: location.lng + 0.002,
          lat: location.lat - 0.001,
          timestamp: Date.now()
        },
        distance: 800
      },
      {
        id: 'fire-001',
        name: '消防救援站',
        phone: '119',
        type: 'fire',
        location: {
          lng: location.lng - 0.001,
          lat: location.lat + 0.002,
          timestamp: Date.now()
        },
        distance: 1200
      }
    ];
  }
}