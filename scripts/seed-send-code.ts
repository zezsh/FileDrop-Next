import { db } from '../db';
import { sendCodes } from '../db/schema';
import { hashSecret } from '../lib/crypto';

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing. tsx must load .env via --env-file.');
    process.exit(1);
  }

  const label = arg('label') ?? 'default';
  const code = arg('code');

  if (!code) {
    console.error('Usage: pnpm db:seed-send-code -- --label default --code <secret>');
    process.exit(1);
  }

  const [row] = await db
    .insert(sendCodes)
    .values({
      label,
      codeHash: await hashSecret(code),
    })
    .returning({ id: sendCodes.id, label: sendCodes.label });

  console.log(`Created send code "${row.label}" (${row.id}). Store the plaintext securely.`);
  await db.$client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
