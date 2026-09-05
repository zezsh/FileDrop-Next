import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { drops, files, sendCodes } from '@/db/schema';
import { generateReceiveCode, hashSecret } from '@/lib/crypto';
import { getEnv } from '@/lib/env';
import { objectKey, presignPut } from '@/lib/s3';
import { findEnabledSendCode } from '@/lib/send-codes';
import { jsonError } from '@/lib/errors';
import { createDropSchema } from '@/lib/validators';

const RECEIVE_CODE_RETRIES = 8;

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError('invalid_json', 400);
  }

  const parsed = createDropSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError('invalid_request', 400);
  }

  const input = parsed.data;
  const sendCode = await findEnabledSendCode(input.sendCode);
  if (!sendCode) {
    return jsonError('invalid_send_code', 401);
  }

  try {
    getEnv();
  } catch {
    return jsonError('storage_not_configured', 500);
  }

  const expiresAt = new Date(Date.now() + input.hours * 60 * 60 * 1000);
  const passwordHash = input.password ? await hashSecret(input.password) : null;

  let drop: typeof drops.$inferSelect | undefined;

  for (let attempt = 0; attempt < RECEIVE_CODE_RETRIES; attempt += 1) {
    const receiveCode = generateReceiveCode();
    try {
      const [created] = await db
        .insert(drops)
        .values({
          receiveCode,
          sendCodeId: sendCode.id,
          passwordHash,
          maxDownloads: input.maxDownloads,
          expiresAt,
        })
        .returning();
      drop = created;
      break;
    } catch {
      continue;
    }
  }

  if (!drop) {
    return jsonError('receive_code_unavailable', 500);
  }

  const prepared = input.files.map((file) => {
    const id = crypto.randomUUID();
    return {
      id,
      dropId: drop.id,
      objectKey: objectKey(drop.id, id, file.name),
      originalName: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    };
  });

  await db.insert(files).values(prepared);

  const uploads = await Promise.all(
    prepared.map(async (row, index) => {
      const meta = input.files[index]!;
      return {
        id: row.id,
        uploadUrl: await presignPut({
          key: row.objectKey,
          contentType: meta.mimeType,
        }),
      };
    }),
  );

  await db.update(sendCodes).set({ lastUsedAt: new Date() }).where(eq(sendCodes.id, sendCode.id));

  return Response.json({
    dropId: drop.id,
    receiveCode: drop.receiveCode,
    expiresAt: drop.expiresAt.toISOString(),
    uploads,
  });
}
