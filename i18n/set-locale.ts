'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { isLocale, type Locale } from './config';

export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) {
    return;
  }

  const store = await cookies();
  store.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  revalidatePath('/');
}
