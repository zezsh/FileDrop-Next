'use client';

import { useRef, useState } from 'react';
import { Download, FileIcon, ArrowLeftToLine, ArrowDownToLine } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { AppError, errorCodeFrom, errorFromUnknown, publicErrorCode } from '@/lib/errors';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';

type ReceivedFile = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
};

type ReceiveResponse = {
  expiresAt?: string;
  remainingDownloads?: number;
  files?: ReceivedFile[];
  error?: string;
  requiresPassword?: boolean;
};

const viewTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] } as const;

export function ReceiveForm() {
  const t = useTranslations('receive');
  const tErrors = useTranslations('errors');
  const tSuccess = useTranslations('success');
  const pendingRef = useRef(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [files, setFiles] = useState<ReceivedFile[] | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);

  async function lookup(nextCode: string, nextPassword?: string) {
    if (pendingRef.current) {
      return;
    }
    if (!/^\d{6}$/.test(nextCode)) {
      toast.error(tErrors('invalid_receive_code'));
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setPasswordError(null);
    const toastId = toast.loading(t('lookingUp'));

    try {
      const response = await fetch(`/api/receive/${nextCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: nextPassword?.trim() || undefined,
        }),
      });
      const payload = (await response.json()) as ReceiveResponse;

      if (payload.requiresPassword) {
        toast.dismiss(toastId);
        setPasswordOpen(true);
        if (nextPassword) {
          setPassword('');
          setPasswordError(tErrors(errorCodeFrom(payload.error, 'invalid_password')));
        }
        return;
      }

      if (!response.ok || !payload.files) {
        throw new AppError(errorCodeFrom(payload.error, 'drop_not_found'));
      }

      if (payload.files.length === 0) {
        toast.error(tErrors('drop_empty'), { id: toastId });
        return;
      }

      setPasswordOpen(false);
      setPassword('');
      setFiles(payload.files);
      toast.success(tSuccess('files_found'), { id: toastId });
    } catch (err) {
      const mapped = errorFromUnknown(err, 'drop_not_found');
      const message = tErrors(publicErrorCode(mapped.code), mapped.vars);
      setFiles(null);
      toast.error(message, { id: toastId });
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  function resetToCode() {
    setFiles(null);
    setCode('');
    setPasswordError(null);
  }

  async function downloadAll() {
    if (!files?.length) {
      return;
    }

    for (const [index, file] of files.entries()) {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.name;
      link.rel = 'noopener';
      document.body.append(link);
      link.click();
      link.remove();

      if (index < files.length - 1) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 150);
        });
      }
    }
  }

  function onPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPassword = password.trim();
    if (!nextPassword) {
      setPasswordError(t('passwordEmpty'));
      return;
    }
    void lookup(code, nextPassword);
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {files ? (
            <motion.div
              key="files"
              className="flex min-h-0 flex-1 flex-col gap-4"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={viewTransition}
            >
              <ScrollArea className="min-h-0 flex-1">
                <ItemGroup>
                  {files.map((file) => (
                    <Item key={file.id} variant="outline">
                      <ItemMedia variant="icon">
                        <FileIcon />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{file.name}</ItemTitle>
                        <ItemDescription>{formatBytes(file.sizeBytes)}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Button
                          variant="secondary"
                          nativeButton={false}
                          render={<a href={file.downloadUrl} />}
                        >
                          <ArrowDownToLine data-icon="inline-start" />
                          {t('download')}
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              </ScrollArea>
              <div className="flex w-2/3 shrink-0 gap-3 self-center">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 gap-3 py-6"
                  onClick={resetToCode}
                >
                  <ArrowLeftToLine data-icon="inline-start" />
                  {t('reenter')}
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-3 py-6"
                  onClick={() => void downloadAll()}
                >
                  <Download data-icon="inline-start" />
                  {t('downloadAll')}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, scale: 0.92, y: -24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -24 }}
              transition={viewTransition}
            >
              <FieldGroup className="w-full max-w-md flex-1 shrink-0 md:mt-30 md:self-center">
                <Field className="gap-6">
                  <FieldLabel htmlFor="receive-code" className="sr-only">
                    {t('code')}
                  </FieldLabel>
                  <h2 className="text-xl font-medium md:text-center">{t('code')}</h2>
                  <InputOTP
                    id="receive-code"
                    maxLength={6}
                    pattern="[0-9]"
                    value={code}
                    onChange={setCode}
                    onComplete={(value) => {
                      void lookup(value);
                    }}
                    inputMode="numeric"
                    disabled={pending}
                  >
                    <InputOTPGroup className={cn('h-15 w-full gap-2 font-extrabold md:gap-3')}>
                      {Array.from({ length: 6 }, (_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-full flex-1 rounded-xl! border-none bg-secondary text-xl text-foreground"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <FieldDescription className="md:text-center">
                    {t('codeHint')}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog
        open={passwordOpen}
        onOpenChange={(open) => {
          setPasswordOpen(open);
          if (!open) {
            setCode('');
            setPassword('');
            setPasswordError(null);
          }
        }}
      >
        <DialogContent>
          <form className="grid gap-6" onSubmit={onPasswordSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold">{t('passwordTitle')}</DialogTitle>
              <DialogDescription>{t('passwordDescription')}</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={passwordError ? true : undefined}>
                <FieldLabel htmlFor="drop-password">{t('password')}</FieldLabel>
                <Input
                  id="drop-password"
                  type="password"
                  autoComplete="off"
                  autoFocus
                  value={password}
                  aria-invalid={passwordError ? true : undefined}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 border-none"
                />
              </Field>
            </FieldGroup>
            {passwordError ? <FieldError>{passwordError}</FieldError> : null}
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={pending} className="h-12 w-full font-semibold">
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {pending ? t('unlocking') : t('unlock')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
