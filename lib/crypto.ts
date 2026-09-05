import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

const PBKDF2_ITERATIONS = 310_000;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_KEY_BITS = 256;

function passwordKdf() {
  return process.env.PASSWORD_KDF === 'argon2' ? 'argon2' : 'pbkdf2';
}

function toB64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('base64url');
}

function fromB64(value: string) {
  return Buffer.from(value, 'base64url');
}

async function derivePbkdf2(plain: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(plain),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: Uint8Array.from(salt), iterations, hash: 'SHA-256' },
    key,
    PBKDF2_KEY_BITS,
  );
  return Buffer.from(bits);
}

async function hashPbkdf2(plain: string) {
  const salt = randomBytes(PBKDF2_SALT_BYTES);
  const derived = await derivePbkdf2(plain, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$sha256$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(derived)}`;
}

async function verifyPbkdf2(hash: string, plain: string) {
  const [scheme, digest, iter, saltB64, derivedB64] = hash.split('$');
  if (scheme !== 'pbkdf2' || digest !== 'sha256' || !saltB64 || !derivedB64) {
    return false;
  }

  const iterations = Number(iter);
  if (!Number.isInteger(iterations) || iterations < 1) {
    return false;
  }

  const expected = fromB64(derivedB64);
  const actual = await derivePbkdf2(plain, fromB64(saltB64), iterations);
  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}

async function hashArgon2(plain: string) {
  const argon2 = await import('argon2');
  return argon2.hash(plain, { type: argon2.argon2id });
}

async function verifyArgon2(hash: string, plain: string) {
  const argon2 = await import('argon2');
  return argon2.verify(hash, plain);
}

export async function hashSecret(plain: string) {
  return passwordKdf() === 'argon2' ? hashArgon2(plain) : hashPbkdf2(plain);
}

export async function verifySecret(hash: string, plain: string) {
  if (hash.startsWith('$argon2')) {
    return verifyArgon2(hash, plain);
  }
  if (hash.startsWith('pbkdf2$')) {
    return verifyPbkdf2(hash, plain);
  }
  return false;
}

export function generateReceiveCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}
