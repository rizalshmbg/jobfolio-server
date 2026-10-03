import type { RequestHandler } from 'express';

import { importJob } from '../services/job-import.service.js';
import type { JobImportInput } from '../validations/job-import.validation.js';

export const importJobController: RequestHandler = async (req, res) => {
  const data = req.body as JobImportInput;

  const result = await importJob(data);

  if (!result) {
    res.status(422).json({
      success: false,
      message: 'Unable to extract job information from this URL',
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: 'Job information imported successfully',
    data: result,
  });
};
