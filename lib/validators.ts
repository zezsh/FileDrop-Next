import * as z from 'zod';
import { MAX_EXPIRE_HOURS, MAX_FILE_SIZE_BYTES, MAX_FILES_PER_DROP } from './limits';

export const fileMetaSchema = z.object({
  name: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(200),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
});

export const createDropSchema = z.object({
  sendCode: z.string().min(1).max(200),
  password: z.string().min(1).max(200).optional(),
  hours: z.number().int().min(1).max(MAX_EXPIRE_HOURS),
  maxDownloads: z.number().int().min(1).max(10_000),
  files: z.array(fileMetaSchema).min(1).max(MAX_FILES_PER_DROP),
});

export const completeDropSchema = z.object({
  fileIds: z.array(z.uuid()).min(1),
});

export const receiveSchema = z.object({
  password: z.string().max(200).optional(),
});

export type CreateDropInput = z.infer<typeof createDropSchema>;
