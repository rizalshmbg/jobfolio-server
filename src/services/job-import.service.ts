import type { JobImportInput } from '../validations/job-import.validation.js';

import { scrapeJob } from './job-scraper.service.js';

export const importJob = async (data: JobImportInput) => {
  return scrapeJob(data.url);
};
