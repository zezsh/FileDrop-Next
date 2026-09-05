import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from './relations';

export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
    ssl: true,
  },
  relations,
});
