import { z } from 'zod';

export const applicationStatusSchema = z.enum([
  'WISHLIST',
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'TECHNICAL_TEST',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
]);

export const employmentTypeSchema = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'FREELANCE',
]);

export const workArrangementSchema = z.enum(['ONSITE', 'HYBRID', 'REMOTE']);

export const createApplicationSchema = z
  .object({
    company: z.string().trim().min(1).max(100),
    position: z.string().trim().min(1).max(100),
    status: applicationStatusSchema.default('APPLIED'),
    appliedAt: z.coerce.date().optional(),
    jobUrl: z.url().optional(),
    location: z.string().trim().max(100).optional(),
    employmentType: employmentTypeSchema.optional(),
    workArrangement: workArrangementSchema.optional(),
    salaryMin: z.number().int().nonnegative().optional(),
    salaryMax: z.number().int().nonnegative().optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (data) =>
      data.salaryMin === undefined ||
      data.salaryMax === undefined ||
      data.salaryMin <= data.salaryMax,
    {
      message: 'Minimum salary cannot be greater than maximum salary',
      path: ['salaryMax'],
    },
  );

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const getApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().min(1).optional(),
  status: applicationStatusSchema.optional(),
});

export type GetApplicationsQuery = z.infer<typeof getApplicationsQuerySchema>;
