import prisma from "../../src/config/prisma.js";

export const testApplication = {
  company: 'Tokopedia',
  position: 'Frontend Developer',
  status: 'APPLIED',
  appliedAt: '2026-09-17',
  jobUrl: 'https://example.com/jobs/frontend',
  location: 'Jakarta',
  employmentType: 'FULL_TIME',
  workArrangement: 'HYBRID',
  salaryMin: 8_000_000,
  salaryMax: 12_000_000,
  notes: 'Applied through career page',
};

export const createTestApplication = async (
  userId: string,
) => {
  return prisma.application.create({
    data: {
      userId,
      company: testApplication.company,
      position: testApplication.position,
      status: 'APPLIED',
    },
  });
};