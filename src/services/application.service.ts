import prisma from '../config/prisma.js';

import type {
  CreateApplicationInput,
  GetApplicationsQuery,
  UpdateApplicationInput,
} from '../validations/application.validation.js';
import type { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../errors/app-error.js';

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

      ...(data.description !== undefined && {
        description: data.description,
      }),

      ...(data.requirements !== undefined && {
        requirements: data.requirements,
      }),

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

      activities: {
        create: {
          type: 'CREATED',
          fromStatus: null,
          toStatus: data.status,
        },
      },
    },
  });
};

export const getApplications = async (
  userId: string,
  query: GetApplicationsQuery,
) => {
  const {
    page,
    limit,
    search,
    status,
    employmentType,
    workArrangement,
    sortBy,
    order,
  } = query;

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

export const getApplicationById = async (
  userId: string,
  applicationId: string,
) => {
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId,
    },
  });

  if (!application) {
    throw new AppError(404, 'Application not found');
  }

  return application;
};

export const updateApplication = async (
  userId: string,
  applicationId: string,
  data: UpdateApplicationInput,
) => {
  const application = await getApplicationById(userId, applicationId);

  const finalSalaryMin =
    data.salaryMin !== undefined ? data.salaryMin : application.salaryMin;
  const finalSalaryMax =
    data.salaryMax !== undefined ? data.salaryMax : application.salaryMax;

  // validation if finalSalaryMin > finalSalaryMax
  if (
    finalSalaryMin !== null &&
    finalSalaryMax !== null &&
    finalSalaryMin > finalSalaryMax
  ) {
    throw new AppError(
      400,
      'Minimum salary cannot be greater than maximum salary',
    );
  }

  const updateData: Prisma.ApplicationUpdateInput = {
    ...(data.company !== undefined && {
      company: data.company,
    }),

    ...(data.position !== undefined && {
      position: data.position,
    }),

    ...(data.description !== undefined && {
      description: data.description,
    }),

    ...(data.requirements !== undefined && {
      requirements: data.requirements,
    }),

    ...(data.status !== undefined && {
      status: data.status,
    }),

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
  };

  const statusChanged =
    data.status !== undefined && data.status !== application.status;

  // check if status changed
  if (statusChanged) {
    return prisma.$transaction(async (tx) => {
      // update application with Prisma
      const updatedApplication = await tx.application.update({
        where: {
          id: application.id,
        },
        data: updateData,
      });

      await tx.applicationActivity.create({
        data: {
          applicationId: application.id,
          type: 'STATUS_CHANGED',
          fromStatus: application.status,
          toStatus: data.status!,
        },
      });

      return updatedApplication;
    });
  }

  return prisma.application.update({
    where: {
      id: application.id,
    },
    data: updateData,
  });
};

export const deleteApplication = async (
  userId: string,
  applicationId: string,
) => {
  const application = await getApplicationById(userId, applicationId);

  await prisma.application.delete({
    where: {
      id: application.id,
    },
  });
};

// APPLICATION ACTIVITIES
export const getApplicationActivities = async (
  userId: string,
  applicationId: string,
) => {
  const application = await getApplicationById(userId, applicationId);

  return prisma.applicationActivity.findMany({
    where: {
      applicationId: application.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};
