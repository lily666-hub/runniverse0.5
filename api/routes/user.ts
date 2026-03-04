import express from 'express';
import { UserService } from '../services/UserService';
import { validateUserPreferencesRequest } from '../middleware/validation';

const router = express.Router();
const userService = new UserService();

// 获取用户资料
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await userService.getUserProfile(userId);
    res.json(profile);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// 更新用户资料
router.put('/profile/:userId', validateUserPreferencesRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const updated = await userService.updateUserProfile(userId, req.body);
    res.json({ success: updated });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// 获取用户安全偏好
router.get('/safety-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await userService.getUserSafetyPreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error('Get safety preferences error:', error);
    res.status(500).json({ error: 'Failed to get safety preferences' });
  }
});

// 更新用户安全偏好
router.put('/safety-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updated = await userService.updateUserSafetyPreferences(userId, req.body);
    res.json({ success: updated });
  } catch (error) {
    console.error('Update safety preferences error:', error);
    res.status(500).json({ error: 'Failed to update safety preferences' });
  }
});

// 获取用户跑步历史
router.get('/running-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const history = await userService.getUserRunningHistory(userId, Number(limit), Number(offset));
    res.json(history);
  } catch (error) {
    console.error('Get running history error:', error);
    res.status(500).json({ error: 'Failed to get running history' });
  }
});

// 记录跑步活动
router.post('/running-activity', async (req, res) => {
  try {
    const activity = await userService.recordRunningActivity(req.body);
    res.json(activity);
  } catch (error) {
    console.error('Record running activity error:', error);
    res.status(500).json({ error: 'Failed to record running activity' });
  }
});

// 获取用户统计数据
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30d' } = req.query;
    const stats = await userService.getUserStats(userId, period as string);
    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

// 获取用户成就
router.get('/achievements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const achievements = await userService.getUserAchievements(userId);
    res.json(achievements);
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ error: 'Failed to get user achievements' });
  }
});

// 获取跑步伙伴
router.get('/running-buddies/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { location, radius = 5000 } = req.query;
    const buddies = await userService.getRunningBuddies(userId, location as string, Number(radius));
    res.json({ buddies });
  } catch (error) {
    console.error('Get running buddies error:', error);
    res.status(500).json({ error: 'Failed to get running buddies' });
  }
});

// 发送跑步邀请
router.post('/running-invitation', async (req, res) => {
  try {
    const invitation = await userService.sendRunningInvitation(req.body);
    res.json(invitation);
  } catch (error) {
    console.error('Send running invitation error:', error);
    res.status(500).json({ error: 'Failed to send running invitation' });
  }
});

// 响应跑步邀请
router.put('/running-invitation/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { response, userId } = req.body;
    const updated = await userService.respondToRunningInvitation(invitationId, userId, response);
    res.json({ success: updated });
  } catch (error) {
    console.error('Respond to invitation error:', error);
    res.status(500).json({ error: 'Failed to respond to invitation' });
  }
});

// 获取用户邀请
router.get('/invitations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'all', status = 'all' } = req.query;
    const invitations = await userService.getUserInvitations(userId, type as string, status as string);
    res.json({ invitations });
  } catch (error) {
    console.error('Get user invitations error:', error);
    res.status(500).json({ error: 'Failed to get user invitations' });
  }
});

// 更新用户位置
router.post('/location/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { location } = req.body;
    const updated = await userService.updateUserLocation(userId, location);
    res.json({ success: updated });
  } catch (error) {
    console.error('Update user location error:', error);
    res.status(500).json({ error: 'Failed to update user location' });
  }
});

// 获取用户通知设置
router.get('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = await userService.getUserNotificationSettings(userId);
    res.json(settings);
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
});

// 更新用户通知设置
router.put('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updated = await userService.updateUserNotificationSettings(userId, req.body);
    res.json({ success: updated });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

export default router;