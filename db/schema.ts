import {
  bigint,
  boolean,
  char,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const sendCodes = pgTable('send_codes', {
  id: uuid().primaryKey().defaultRandom(),
  label: text().notNull(),
  codeHash: text('code_hash').notNull(),
  enabled: boolean().notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
});

export const drops = pgTable('drops', {
  id: uuid().primaryKey().defaultRandom(),
  receiveCode: char('receive_code', { length: 6 }).notNull().unique(),
  sendCodeId: uuid('send_code_id')
    .notNull()
    .references(() => sendCodes.id),
  passwordHash: text('password_hash'),
  maxDownloads: integer('max_downloads').notNull(),
  downloadCount: integer('download_count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const files = pgTable('files', {
  id: uuid().primaryKey().defaultRandom(),
  dropId: uuid('drop_id')
    .notNull()
    .references(() => drops.id, { onDelete: 'cascade' }),
  objectKey: text('object_key').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  status: text().$type<'pending' | 'uploaded'>().notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
