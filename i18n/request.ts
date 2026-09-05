import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import './global';
import { defaultLocale, isLocale, localeFromAcceptLanguage } from './config';

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get('locale')?.value;
  const headerLocale = localeFromAcceptLanguage((await headers()).get('accept-language'));
  const locale =
    cookieLocale && isLocale(cookieLocale) ? cookieLocale : (headerLocale ?? defaultLocale);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
