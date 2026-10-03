import { z } from 'zod';

export const jobImportSchema = z.object({
  url: z.url(),
});

export type JobImportInput = z.infer<typeof jobImportSchema>;
