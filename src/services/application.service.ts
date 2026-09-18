import prisma from '../config/prisma.js';

import type {
  CreateApplicationInput,
  GetApplicationsQuery,
} from '../validations/application.validations.js';
import type { Prisma } from '../generated/prisma/client.js';

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
  const { page, limit, search, status, employmentType, workArrangement, sortBy, order } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.ApplicationWhereInput = {
    userId,
    ...(status && {
      status,
    }),

    ...(employmentType && {
      employmentType,
    }),

    ...(workArrangement && {
      workArrangement,
    }),

    ...(search && {
      OR: [
        {
          company: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          position: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ],
    }),
  };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: {
        [sortBy]: order,
      },
      skip,
      take: limit,
    }),

    prisma.application.count({
      where,
    }),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
