import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

type JobScraperResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export type ScrapedJob = {
  company: string | null;
  position: string | null;
  description: string | null;
  requirements: string[];
  jobUrl: string;
  location: string | null;
  employmentType:
    | 'FULL_TIME'
    | 'PART_TIME'
    | 'CONTRACT'
    | 'INTERNSHIP'
    | 'FREELANCE'
    | null;
  workArrangement: 'ONSITE' | 'HYBRID' | 'REMOTE' | null;
  salaryMin: number | null;
  salaryMax: number | null;
};

const SCRAPER_TIMEOUT_MS = 15_000;

export const scrapeJob = async (url: string): Promise<ScrapedJob> => {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, SCRAPER_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.JOB_SCRAPER_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    let body: JobScraperResponse<ScrapedJob> | null = null;

    try {
      body = (await response.json()) as JobScraperResponse<ScrapedJob>;
    } catch {
      throw new AppError(502, 'Job scraper returned an invalid response');
    }

    if (!response.ok) {
      throw new AppError(
        response.status === 400
          ? 422
          : response.status >= 500
            ? 502
            : response.status,
        body.message || 'Unable to scrape job page',
      );
    }

    if (!body.success || !body.data) {
      throw new AppError(
        422,
        body.message || 'Unable to extract job information',
      );
    }

    return body.data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError(408, 'Job scraper request timed out');
    }

    throw new AppError(502, 'Unable to connect to job scraper service');
  } finally {
    clearTimeout(timeout);
  }
};
