'use client';

import { useSyncExternalStore, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { ChevronDownIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { localeLabels, locales, type Locale } from '@/i18n/config';
import { setLocale } from '@/i18n/set-locale';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppearanceSwitcher() {
  const locale = useLocale();
  const t = useTranslations('home');
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const currentTheme = mounted ? (theme ?? 'system') : 'system';
  const ThemeIcon =
    currentTheme === 'dark' ? MoonIcon : currentTheme === 'light' ? SunIcon : MonitorIcon;

  function onSelect(next: Locale) {
    if (next === locale) {
      return;
    }
    startTransition(() => {
      void setLocale(next);
    });
  }

  return (
    <ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" disabled={pending} aria-label={t('language')} />
          }
        >
          {localeLabels[locale]}
          <ChevronDownIcon data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {locales.map((item) => (
              <DropdownMenuItem
                key={item}
                onClick={() => onSelect(item)}
                className={item === locale ? 'bg-accent' : undefined}
              >
                {localeLabels[item]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        size="icon-sm"
        disabled={!mounted}
        aria-label={
          currentTheme === 'dark'
            ? t('themeDark')
            : currentTheme === 'light'
              ? t('themeLight')
              : t('themeSystem')
        }
        onClick={() => {
          if (currentTheme === 'light') {
            setTheme('dark');
            return;
          }
          if (currentTheme === 'dark') {
            setTheme('system');
            return;
          }
          setTheme('light');
        }}
      >
        <ThemeIcon className="pr-0.5" />
      </Button>
    </ButtonGroup>
  );
}
