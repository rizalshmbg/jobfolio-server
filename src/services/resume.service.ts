import { randomUUID } from 'node:crypto';
import path from 'node:path';

import prisma from '../config/prisma.js';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
} as const;

type ResumeFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

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

export const uploadResume = async (userId: string, file: ResumeFile) => {
  if (!file) {
    throw new AppError(400, 'Resume file is required');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new AppError(400, 'Resume file size must not exceed 5 MB');
  }

  const extension =
    ALLOWED_MIME_TYPES[file.mimetype as keyof typeof ALLOWED_MIME_TYPES];

  if (!extension) {
    throw new AppError(400, 'Resume file must be PDF, DOC, or DOCX');
  }

  const existingResume = await prisma.resume.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      filePath: true,
    },
  });

  const resumeId = existingResume?.id ?? randomUUID();

  const filePath = `resumes/${userId}/${resumeId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(env.SUPABASE_RESUME_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new AppError(500, 'Failed to upload resume');
  }

  try {
    const resume = await prisma.resume.upsert({
      where: {
        userId,
      },
      create: {
        id: resumeId,
        userId,
        fileName: path.basename(file.originalname),
        filePath,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
      update: {
        fileName: path.basename(file.originalname),
        filePath,
        mimeType: file.mimetype,
        fileSize: file.size,
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

    if (existingResume?.filePath) {
      const { error: deleteError } = await supabase.storage
        .from(env.SUPABASE_RESUME_BUCKET)
        .remove([existingResume.filePath]);

      if (deleteError) {
        console.error('Failed to delete old resume:', deleteError);
      }

      return resume;
    }
  } catch (error) {
    await supabase.storage.from(env.SUPABASE_RESUME_BUCKET).remove([filePath]);

    throw error;
  }
};
