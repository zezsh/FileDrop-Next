'use client';

import { useTranslations } from 'next-intl';
import { ReceiveForm } from '@/components/receive-form';
import { SendForm } from '@/components/send-form';
import { AppearanceSwitcher } from '@/components/appearance-switcher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function HomePanel() {
  const t = useTranslations('home');

  return (
    <Tabs
      defaultValue="send"
      className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col gap-8 px-4"
    >
      <div className="flex shrink-0 flex-col gap-4 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
          <AppearanceSwitcher />
        </div>
        <TabsList>
          <TabsTrigger value="send">{t('send')}</TabsTrigger>
          <TabsTrigger value="receive">{t('receive')}</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="send" className="flex min-h-0 flex-1 flex-col pb-6">
        <SendForm />
      </TabsContent>
      <TabsContent value="receive" className="flex min-h-0 flex-1 flex-col pb-6">
        <ReceiveForm />
      </TabsContent>
    </Tabs>
  );
}
