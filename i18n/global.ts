import { locales } from './config';
import type en from '../messages/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof en;
  }
}
