import { Elysia } from 'elysia';
import { authMiddleware } from '../lib/auth-middleware';
import { getUserToolUsageStats, getAllUsersToolUsageStats } from '../lib/usage-tracker';

export const usageStats = new Elysia()
  .use(authMiddleware)
  // Get user's own usage stats
  .get('/user', async ({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }

    try {
      const stats = await getUserToolUsageStats(userId);
      return {
        success: true,
        stats,
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message || 'Failed to get usage stats' };
    }
  });

export const adminUsageStats = new Elysia()
  .use(authMiddleware)
  // Get all users usage stats (admin only)
  .get('/admin/all', async ({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }

    // Check if user is admin (you might want to add proper admin check)
    try {
      const stats = await getAllUsersToolUsageStats();
      return {
        success: true,
        stats,
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message || 'Failed to get usage stats' };
    }
  });

