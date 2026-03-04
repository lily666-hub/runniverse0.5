import express from 'express';
import { EmergencyService } from '../services/EmergencyService';
import { validateEmergencyReportRequest } from '../middleware/validation';
import { io } from '../server';

const router = express.Router();
const emergencyService = new EmergencyService();

// 报告紧急情况
router.post('/report', validateEmergencyReportRequest, async (req, res) => {
  try {
    const report = await emergencyService.reportEmergency(req.body);
    
    // 实时通知相关用户
    io.emit('emergency_alert', {
      reportId: report.reportId,
      type: req.body.type,
      location: req.body.location,
      severity: req.body.severity,
      timestamp: req.body.timestamp
    });

    res.json(report);
  } catch (error) {
    console.error('Emergency report error:', error);
    res.status(500).json({ error: 'Failed to report emergency' });
  }
});

// 获取紧急联系人
router.post('/contacts', async (req, res) => {
  try {
    const { location, radius } = req.body;
    const contacts = await emergencyService.getNearbyEmergencyContacts(location, radius);
    res.json({ contacts });
  } catch (error) {
    console.error('Emergency contacts error:', error);
    res.status(500).json({ error: 'Failed to get emergency contacts' });
  }
});

// 获取紧急报告状态
router.get('/report/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const status = await emergencyService.getEmergencyReportStatus(reportId);
    res.json(status);
  } catch (error) {
    console.error('Emergency report status error:', error);
    res.status(500).json({ error: 'Failed to get emergency report status' });
  }
});

// 更新紧急报告状态
router.put('/report/:reportId/status', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, notes } = req.body;
    const updated = await emergencyService.updateEmergencyReportStatus(reportId, status, notes);
    
    // 通知相关用户状态更新
    io.emit('emergency_status_update', {
      reportId,
      status,
      timestamp: Date.now()
    });

    res.json({ success: updated });
  } catch (error) {
    console.error('Update emergency status error:', error);
    res.status(500).json({ error: 'Failed to update emergency status' });
  }
});

// 获取用户紧急报告历史
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    const history = await emergencyService.getUserEmergencyHistory(userId, Number(limit), Number(offset));
    res.json(history);
  } catch (error) {
    console.error('Emergency history error:', error);
    res.status(500).json({ error: 'Failed to get emergency history' });
  }
});

// SOS 快速报警
router.post('/sos', async (req, res) => {
  try {
    const { userId, location } = req.body;
    const sosReport = await emergencyService.triggerSOS(userId, location);
    
    // 立即广播SOS警报
    io.emit('sos_alert', {
      reportId: sosReport.reportId,
      userId,
      location,
      timestamp: Date.now()
    });

    res.json(sosReport);
  } catch (error) {
    console.error('SOS error:', error);
    res.status(500).json({ error: 'Failed to trigger SOS' });
  }
});

// 取消紧急报告
router.delete('/report/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { userId, reason } = req.body;
    const cancelled = await emergencyService.cancelEmergencyReport(reportId, userId, reason);
    
    // 通知取消
    io.emit('emergency_cancelled', {
      reportId,
      reason,
      timestamp: Date.now()
    });

    res.json({ success: cancelled });
  } catch (error) {
    console.error('Cancel emergency error:', error);
    res.status(500).json({ error: 'Failed to cancel emergency report' });
  }
});

// 获取附近的紧急事件
router.post('/nearby-incidents', async (req, res) => {
  try {
    const { location, radius, timeRange } = req.body;
    const incidents = await emergencyService.getNearbyEmergencyIncidents(location, radius, timeRange);
    res.json({ incidents });
  } catch (error) {
    console.error('Nearby incidents error:', error);
    res.status(500).json({ error: 'Failed to get nearby incidents' });
  }
});

// 设置紧急联系人
router.post('/contacts/personal', async (req, res) => {
  try {
    const { userId, contacts } = req.body;
    const updated = await emergencyService.setPersonalEmergencyContacts(userId, contacts);
    res.json({ success: updated });
  } catch (error) {
    console.error('Set personal contacts error:', error);
    res.status(500).json({ error: 'Failed to set personal emergency contacts' });
  }
});

// 获取个人紧急联系人
router.get('/contacts/personal/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const contacts = await emergencyService.getPersonalEmergencyContacts(userId);
    res.json({ contacts });
  } catch (error) {
    console.error('Get personal contacts error:', error);
    res.status(500).json({ error: 'Failed to get personal emergency contacts' });
  }
});

export default router;