import prisma from '../config/prisma.js';
import { AppError } from '../errors/app-error.js';

export const getResume = async (userId: string) => {
  const resume = await prisma.resume.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      fileSize: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!resume) {
    throw new AppError(404, 'Resume not found');
  }

  return resume;
};
