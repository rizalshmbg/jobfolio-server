import prisma from '../config/prisma.js';

import type {
  CreateApplicationInput,
  GetApplicationsQuery,
} from '../validations/application.validations.js';

export const createApplication = async (
  userId: string,
  data: CreateApplicationInput,
) => {
  return prisma.application.create({
    data: {
      userId,
      company: data.company,
      position: data.position,
      status: data.status,

      ...(data.appliedAt !== undefined && {
        appliedAt: data.appliedAt,
      }),

      ...(data.jobUrl !== undefined && {
        jobUrl: data.jobUrl,
      }),

      ...(data.location !== undefined && {
        location: data.location,
      }),

      ...(data.employmentType !== undefined && {
        employmentType: data.employmentType,
      }),

      ...(data.workArrangement !== undefined && {
        workArrangement: data.workArrangement,
      }),

      ...(data.salaryMin !== undefined && {
        salaryMin: data.salaryMin,
      }),

      ...(data.salaryMax !== undefined && {
        salaryMax: data.salaryMax,
      }),

      ...(data.notes !== undefined && {
        notes: data.notes,
      }),
    },
  });
};

export const getApplications = async (
  userId: string,
  query: GetApplicationsQuery,
) => {
  const { page, limit } = query;

  const skip = (page - 1) * limit;

  const [applications, total] =
    await Promise.all([
      prisma.application.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      prisma.application.count({
        where: {
          userId,
        },
      }),
    ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  };
};
