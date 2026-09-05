import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { files } from '@/db/schema';
import { jsonError } from '@/lib/errors';
import { completeDropSchema } from '@/lib/validators';

export async function POST(request: Request, context: RouteContext<'/api/drops/[id]/complete'>) {
  const { id } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError('invalid_json', 400);
  }

  const parsed = completeDropSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError('invalid_request', 400);
  }

  await db
    .update(files)
    .set({ status: 'uploaded' })
    .where(and(eq(files.dropId, id), inArray(files.id, parsed.data.fileIds)));

  return Response.json({ ok: true });
}
