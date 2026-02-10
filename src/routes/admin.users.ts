import { Elysia } from 'elysia';
import { authMiddleware } from '../lib/auth-middleware';
import prisma from '../lib/prisma';

export const adminUsers = new Elysia()
  .use(authMiddleware)
  // Get all users (admin only)
  .get('/all', async ({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }

    try {
      // Get all users with their usage stats
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              toolUsages: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Get active users (users who have used tools in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUserIds = await prisma.toolUsage.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      const activeUserIdsSet = new Set(activeUserIds.map(u => u.userId).filter(Boolean));

      // Format users with additional info
      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        joinDate: user.createdAt.toISOString().split('T')[0],
        totalUses: user._count.toolUsages,
        status: activeUserIdsSet.has(user.id) ? 'Active' : 'Inactive',
        plan: 'Free', // Can be extended later with subscription model
      }));

      return {
        success: true,
        users: formattedUsers,
        total: formattedUsers.length,
        active: formattedUsers.filter(u => u.status === 'Active').length,
      };
    } catch (error: any) {
      console.error('Error fetching users:', error);
      set.status = 500;
      return { success: false, message: error.message || 'Failed to fetch users' };
    }
  });

