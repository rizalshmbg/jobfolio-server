import prisma from '../config/prisma.js';

import type { CreateApplicationInput } from '../validations/application.validations.js';

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
