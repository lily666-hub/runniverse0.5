import express from 'express';
import { SafetyService } from '../services/SafetyService';
import { validateSafetyAssessmentRequest, validateLocationUpdateRequest } from '../middleware/validation';

const router = express.Router();
const safetyService = new SafetyService();

// 获取安全评估
router.post('/assessment', validateSafetyAssessmentRequest, async (req, res) => {
  try {
    const assessment = await safetyService.getSafetyAssessment(req.body);
    res.json(assessment);
  } catch (error) {
    console.error('Safety assessment error:', error);
    res.status(500).json({ error: 'Failed to get safety assessment' });
  }
});

// 获取实时安全评分
router.post('/realtime-score', validateLocationUpdateRequest, async (req, res) => {
  try {
    const { location } = req.body;
    const score = await safetyService.getRealTimeSafetyScore(location);
    res.json({ score });
  } catch (error) {
    console.error('Real-time safety score error:', error);
    res.status(500).json({ error: 'Failed to get real-time safety score' });
  }
});

// 获取历史安全数据
router.post('/historical', async (req, res) => {
  try {
    const { location, timeRange } = req.body;
    const data = await safetyService.getHistoricalSafetyData(location, timeRange);
    res.json(data);
  } catch (error) {
    console.error('Historical safety data error:', error);
    res.status(500).json({ error: 'Failed to get historical safety data' });
  }
});

// 路线安全分析
router.post('/route-analysis', async (req, res) => {
  try {
    const { routePoints } = req.body;
    const analysis = await safetyService.getRouteSafetyAnalysis(routePoints);
    res.json({ routes: analysis });
  } catch (error) {
    console.error('Route safety analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze route safety' });
  }
});

// 获取风险热点
router.post('/risk-hotspots', async (req, res) => {
  try {
    const { location, radius } = req.body;
    const hotspots = await safetyService.getRiskHotspots(location, radius);
    res.json({ hotspots });
  } catch (error) {
    console.error('Risk hotspots error:', error);
    res.status(500).json({ error: 'Failed to get risk hotspots' });
  }
});

// 报告安全事件
router.post('/report-incident', async (req, res) => {
  try {
    const incident = await safetyService.reportSafetyIncident(req.body);
    res.json(incident);
  } catch (error) {
    console.error('Report incident error:', error);
    res.status(500).json({ error: 'Failed to report incident' });
  }
});

// 获取安全建议
router.post('/recommendations', async (req, res) => {
  try {
    const { location, userProfile, timeSlot } = req.body;
    const recommendations = await safetyService.getSafetyRecommendations(location, userProfile, timeSlot);
    res.json({ recommendations });
  } catch (error) {
    console.error('Safety recommendations error:', error);
    res.status(500).json({ error: 'Failed to get safety recommendations' });
  }
});

// 获取最佳跑步时间
router.post('/best-times', async (req, res) => {
  try {
    const { location } = req.body;
    const bestTimes = await safetyService.getBestRunningTimes(location);
    res.json({ bestTimes });
  } catch (error) {
    console.error('Best running times error:', error);
    res.status(500).json({ error: 'Failed to get best running times' });
  }
});

// 获取女性专用安全功能
router.get('/women-features', async (req, res) => {
  try {
    const features = await safetyService.getWomenSafetyFeatures();
    res.json({ features });
  } catch (error) {
    console.error('Women safety features error:', error);
    res.status(500).json({ error: 'Failed to get women safety features' });
  }
});

// 更新用户安全偏好
router.post('/preferences', async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    const updated = await safetyService.updateSafetyPreferences(userId, preferences);
    res.json({ success: updated });
  } catch (error) {
    console.error('Update safety preferences error:', error);
    res.status(500).json({ error: 'Failed to update safety preferences' });
  }
});

export default router;