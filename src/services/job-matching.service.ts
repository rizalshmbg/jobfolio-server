import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { getApplicationById } from './application.service.js';
import { getResumeFile } from './resume.service.js';

type MatchResult = {
  final_score: number;
  required_skills_score: number;
  experience_score: number;
  projects_score: number;
  qualification_score: number;
  preferred_skills_score: number | null;
  preferred_skills_available: boolean;
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  experience_matches: Array<{
    matched: boolean;
    relevance: string;
    evidence: string[];
  }>;
  project_matches: Array<{
    matched: boolean;
    relevance: string;
    evidence: string[];
  }>;
  qualification_matches: Array<{
    matched: boolean;
    relevance: string;
    evidence: string[];
  }>;
};

type MatchResponse = {
  success: boolean;
  message: string;
  data?: MatchResult;
};

type MatchErrorResponse = {
  detail?: unknown;
};

const MATCH_TIMEOUT_MS = 30_000;

export const matchApplication = async (
  userId: string,
  applicationId: string,
): Promise<MatchResult> => {
  const [application, resume] = await Promise.all([
    getApplicationById(userId, applicationId),
    getResumeFile(userId),
  ]);

  const job = {
    company: application.company,
    position: application.position,
    description: application.description,
    requirements: normalizeRequirements(application.requirements),
    location: application.location,
    employmentType: application.employmentType,
    workArrangement: application.workArrangement,
  };

  const formData = new FormData();

  const resumeBlob = new Blob([resume.buffer], {
    type: resume.mimeType,
  });

  formData.append('resume', resumeBlob, resume.fileName);

  formData.append('job', JSON.stringify(job));

  const controller = new AbortController();

  const timeout = setTimeout(() => controller.abort(), MATCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.JOB_SCRAPER_URL}/analyze-and-match`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    let body: unknown;

    try {
      body = await response.json();
    } catch {
      throw new AppError(
        502,
        'Job matching service returned an invalid response',
      );
    }

    if (!response.ok) {
      const errorBody = body as MatchErrorResponse;

      const message =
        typeof errorBody.detail === 'string'
          ? errorBody.detail
          : 'Unable to analyze and match resume';

      throw new AppError(
        response.status === 400
          ? 422
          : response.status >= 500
            ? 502
            : response.status,
        message,
      );
    }

    const successBody = body as MatchResponse;

    if (!successBody.success || !successBody.data) {
      throw new AppError(
        422,
        successBody.message || 'Unable to analyze and match resume',
      );
    }

    return successBody.data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError(408, 'Job matching request timed out');
    }

    throw new AppError(502, 'Unable to connect to job matching service');
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeRequirements = (requirements: unknown): string[] => {
  if (!Array.isArray(requirements)) {
    return [];
  }

  return requirements.filter(
    (requirement): requirement is string => typeof requirement === 'string',
  );
};
