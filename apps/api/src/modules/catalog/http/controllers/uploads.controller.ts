import { Request, Response } from 'express';
import { asyncHandler } from '@shared/http/asyncHandler';
import { AppError } from '@shared/errors/AppError';
import { storage } from '@shared/infra';

export const uploadBookCover = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded (field name: file)', 400);
  }
  const url = storage.publicUrl('books', req.file.filename);
  res.status(201).json({ url });
});
