import prisma from '../config/prisma.js';

export const getDashboard = async (userId: string) => {
  const [statusCounts, recentApplications] = await Promise.all([
    prisma.application.groupBy({
      by: ['status'],
      where: {
        userId,
      },
      _count: {
        _all: true,
      },
    }),

    prisma.application.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        company: true,
        position: true,
        status: true,
        appliedAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const statusKeyMap = {
    WISHLIST: 'wishlist',
    APPLIED: 'applied',
    SCREENING: 'screening',
    INTERVIEW: 'interview',
    TECHNICAL_TEST: 'technicalTest',
    OFFER: 'offer',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
  } as const;

  const summary = {
    total: 0,
    wishlist: 0,
    applied: 0,
    screening: 0,
    interview: 0,
    technicalTest: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  };

  for (const item of statusCounts) {
    const key = statusKeyMap[item.status];

    summary[key] = item._count._all;
    summary.total += item._count._all;
  }

  return {
    summary,
    recentApplications,
  };
};
