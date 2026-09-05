import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { drops, files } from '@/db/schema';
import { verifySecret } from '@/lib/crypto';
import { jsonError } from '@/lib/errors';
import { presignGet } from '@/lib/s3';
import { receiveSchema } from '@/lib/validators';

export async function POST(request: Request, context: RouteContext<'/api/receive/[code]'>) {
  const { code } = await context.params;
  if (!/^\d{6}$/.test(code)) {
    return jsonError('invalid_receive_code', 400);
  }

  let json: unknown = {};
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      json = await request.json();
    } catch {
      return jsonError('invalid_json', 400);
    }
  }

  const parsed = receiveSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError('invalid_receive_code', 400);
  }

  const [drop] = await db.select().from(drops).where(eq(drops.receiveCode, code));

  if (!drop || drop.expiresAt <= new Date()) {
    return jsonError('drop_not_found', 404);
  }

  if (drop.downloadCount >= drop.maxDownloads) {
    return jsonError('download_limit_reached', 409);
  }

  if (drop.passwordHash) {
    const password = parsed.data.password;
    if (!password) {
      return jsonError('password_required', 401, { requiresPassword: true });
    }
    try {
      if (!(await verifySecret(drop.passwordHash, password))) {
        return jsonError('invalid_password', 401, { requiresPassword: true });
      }
    } catch {
      return jsonError('invalid_password', 401, { requiresPassword: true });
    }
  }

  const uploaded = await db
    .select()
    .from(files)
    .where(and(eq(files.dropId, drop.id), eq(files.status, 'uploaded')));

  if (uploaded.length === 0) {
    return Response.json({
      expiresAt: drop.expiresAt.toISOString(),
      remainingDownloads: drop.maxDownloads - drop.downloadCount,
      files: [],
    });
  }

  const [claimed] = await db
    .update(drops)
    .set({ downloadCount: sql`${drops.downloadCount} + 1` })
    .where(
      and(
        eq(drops.id, drop.id),
        gt(drops.expiresAt, new Date()),
        sql`${drops.downloadCount} < ${drops.maxDownloads}`,
      ),
    )
    .returning({ id: drops.id });

  if (!claimed) {
    return jsonError('download_limit_reached', 409);
  }

  const listed = await Promise.all(
    uploaded.map(async (file) => ({
      id: file.id,
      name: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      downloadUrl: await presignGet({ key: file.objectKey, fileName: file.originalName }),
    })),
  );

  return Response.json({
    expiresAt: drop.expiresAt.toISOString(),
    remainingDownloads: drop.maxDownloads - drop.downloadCount - 1,
    files: listed,
  });
}
