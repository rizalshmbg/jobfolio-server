import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
  })
  .refine(
    (data) => data.name !== undefined,
    {
      message: 'At least one field must be provided',
    },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
