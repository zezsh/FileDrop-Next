export const locales = ['en', 'zh-CN', 'ja'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeLabels = {
  en: 'English',
  'zh-CN': '简体中文',
  ja: '日本語',
} as const satisfies Record<Locale, string>;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) {
    return null;
  }

  const tags = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: (tag ?? '').trim(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of tags) {
    if (isLocale(tag)) {
      return tag;
    }
    const prefix = tag.split('-')[0]?.toLowerCase();
    if (prefix === 'zh') {
      return 'zh-CN';
    }
    if (prefix === 'ja') {
      return 'ja';
    }
    if (prefix === 'en') {
      return 'en';
    }
  }

  return null;
}
