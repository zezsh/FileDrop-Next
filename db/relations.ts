import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  sendCodes: {
    drops: r.many.drops({
      from: r.sendCodes.id,
      to: r.drops.sendCodeId,
    }),
  },
  drops: {
    sendCode: r.one.sendCodes({
      from: r.drops.sendCodeId,
      to: r.sendCodes.id,
    }),
    files: r.many.files({
      from: r.drops.id,
      to: r.files.dropId,
    }),
  },
  files: {
    drop: r.one.drops({
      from: r.files.dropId,
      to: r.drops.id,
    }),
  },
}));
