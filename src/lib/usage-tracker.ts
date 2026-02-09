import prisma from './prisma';

export async function trackToolUsage(
  userId: string | null,
  toolName: string,
  toolType: 'image' | 'pdf',
  toolEndpoint: string
) {
  try {
    // Only track if user is authenticated
    if (!userId) {
      return;
    }

    await prisma.toolUsage.create({
      data: {
        userId,
        toolName,
        toolType,
        toolEndpoint,
      },
    });
  } catch (error) {
    // Log error but don't throw - we don't want to break the tool functionality
    console.error('Error tracking tool usage:', error);
  }
}

export async function getUserToolUsageStats(userId: string) {
  try {
    const stats = await prisma.toolUsage.groupBy({
      by: ['toolName'],
      where: {
        userId,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const totalUsage = await prisma.toolUsage.count({
      where: {
        userId,
      },
    });

    return {
      totalUsage,
      byTool: stats.map((stat) => ({
        toolName: stat.toolName,
        count: stat._count.id,
      })),
    };
  } catch (error) {
    console.error('Error getting user tool usage stats:', error);
    return {
      totalUsage: 0,
      byTool: [],
    };
  }
}

export async function getAllUsersToolUsageStats() {
  try {
    const stats = await prisma.toolUsage.groupBy({
      by: ['toolName'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const totalUsage = await prisma.toolUsage.count();
    const totalUsers = await prisma.user.count();

    const userStats = await prisma.toolUsage.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
    });

    return {
      totalUsage,
      totalUsers,
      activeUsers: userStats.length,
      byTool: stats.map((stat) => ({
        toolName: stat.toolName,
        count: stat._count.id,
      })),
    };
  } catch (error) {
    console.error('Error getting all users tool usage stats:', error);
    return {
      totalUsage: 0,
      totalUsers: 0,
      activeUsers: 0,
      byTool: [],
    };
  }
}

