import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sendCodes } from '@/db/schema';
import { verifySecret } from './crypto';

export async function findEnabledSendCode(plain: string) {
  const rows = await db.select().from(sendCodes).where(eq(sendCodes.enabled, true));

  for (const row of rows) {
    try {
      if (await verifySecret(row.codeHash, plain)) {
        return row;
      }
    } catch {
      continue;
    }
  }

  return null;
}
