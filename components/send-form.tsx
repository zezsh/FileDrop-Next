'use client';

import { useRef, useState } from 'react';
import {
  CopyIcon,
  FileIcon,
  FolderOpenDot,
  FolderUp,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Progress, ProgressLabel } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatBytes } from '@/lib/format';
import { ProgressValue } from '@/components/ui/progress';
import { AppError, errorCodeFrom, errorFromUnknown } from '@/lib/errors';

const expireUnits = [
  { label: 'h', value: 'h' },
  { label: 'D', value: 'd' },
] as const;

type UploadTarget = {
  id: string;
  uploadUrl: string;
};

type CreateDropResponse = {
  dropId: string;
  receiveCode: string;
  expiresAt: string;
  uploads: UploadTarget[];
  error?: string;
};

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function totalUploadPercent(list: File[], fileProgress: Record<string, number>) {
  const total = list.reduce((sum, file) => sum + file.size, 0);
  if (total === 0) {
    return 0;
  }
  const loaded = list.reduce(
    (sum, file) => sum + ((fileProgress[fileKey(file)] ?? 0) / 100) * file.size,
    0,
  );
  return Math.round((loaded / total) * 100);
}

function putFile(url: string, file: File, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) {
        return;
      }
      onProgress(Math.round((event.loaded / event.total) * 100));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(new AppError('upload_failed', { file: file.name }));
    });
    xhr.addEventListener('error', () => {
      reject(new AppError('upload_blocked'));
    });
    xhr.send(file);
  });
}

export function SendForm() {
  const t = useTranslations('send');
  const tErrors = useTranslations('errors');
  const tSuccess = useTranslations('success');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [sendCode, setSendCode] = useState('');
  const [password, setPassword] = useState('');
  const [expireAmount, setExpireAmount] = useState('24');
  const [expireUnit, setExpireUnit] = useState<'h' | 'd'>('h');
  const [maxDownloads, setMaxDownloads] = useState('10');
  const [pending, setPending] = useState(false);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const [receiveCode, setReceiveCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasFiles = files.length > 0;
  const progress = totalUploadPercent(files, fileProgress);

  function addFiles(list: FileList | null) {
    if (!list) {
      return;
    }
    setFiles((current) => {
      const next = [...current];
      for (const file of Array.from(list)) {
        if (!next.some((item) => item.name === file.name && item.size === file.size)) {
          next.push(file);
        }
      }
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (files.length === 0) {
      const message = tErrors('no_files');
      setError(message);
      toast.error(message);
      return;
    }

    setPending(true);
    setFileProgress({});

    try {
      const created = await fetch('/api/drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendCode,
          password: password.trim() || undefined,
          hours: expireUnit === 'd' ? Number(expireAmount) * 24 : Number(expireAmount),
          maxDownloads: Number(maxDownloads),
          files: files.map((file) => ({
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          })),
        }),
      });

      const payload = (await created.json()) as CreateDropResponse;
      if (!created.ok) {
        throw new AppError(errorCodeFrom(payload.error, 'unknown'));
      }

      for (const [index, upload] of payload.uploads.entries()) {
        const file = files[index];
        if (!file) {
          throw new AppError('file_list_mismatch');
        }

        const key = fileKey(file);
        setFileProgress((current) => ({ ...current, [key]: 0 }));
        await putFile(upload.uploadUrl, file, (percent) => {
          setFileProgress((current) => ({ ...current, [key]: percent }));
        });
      }

      const complete = await fetch(`/api/drops/${payload.dropId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: payload.uploads.map((item) => item.id) }),
      });

      if (!complete.ok) {
        const completePayload = (await complete.json()) as { error?: string };
        throw new AppError(errorCodeFrom(completePayload.error, 'finalize_failed'));
      }

      setReceiveCode(payload.receiveCode);
      toast.success(tSuccess('files_sent'));
    } catch (err) {
      const mapped = errorFromUnknown(err);
      const message = tErrors(mapped.code, mapped.vars);
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  if (receiveCode) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-y-auto">
          <p className="text-sm text-muted-foreground">{t('shareCode')}</p>
          <p className="font-heading text-4xl tracking-[0.3em]">{receiveCode}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(receiveCode);
              toast.success(tSuccess('copied'));
            }}
          >
            <CopyIcon data-icon="inline-start" />
            {t('copyCode')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setReceiveCode(null);
              setFiles([]);
              setFileProgress({});
              setPassword('');
            }}
          >
            {t('sendMore')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <Field
          orientation={hasFiles ? 'horizontal' : 'vertical'}
          className={cn('shrink-0', hasFiles ? 'justify-end' : 'min-h-0 flex-1')}
        >
          <FieldLabel htmlFor="files" className="sr-only">
            {t('files')}
          </FieldLabel>
          <input
            ref={fileInputRef}
            id="files"
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = '';
            }}
          />
          {hasFiles && pending ? (
            <Progress
              value={progress}
              className="max-w-2/3 min-w-0 flex-1 gap-2 **:data-[slot=progress-track]:h-1"
            >
              <ProgressLabel className="text-xs">{t('uploading')}</ProgressLabel>
              <ProgressValue className="text-xs" />
            </Progress>
          ) : null}

          <ButtonGroup className={cn(hasFiles ? 'ml-auto' : 'min-h-0 w-full flex-1')}>
            <Button
              variant={hasFiles ? 'default' : 'outline'}
              disabled={pending}
              className={cn(
                hasFiles
                  ? undefined
                  : 'h-auto min-h-0 w-full flex-1 flex-col border-dashed p-6 text-muted-foreground',
                isDragging && 'border-ring bg-accent text-accent-foreground',
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setIsDragging(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                addFiles(event.dataTransfer.files);
              }}
            >
              {isDragging ? (
                <FolderOpenDot data-icon="inline-start" className="size-8" />
              ) : hasFiles ? (
                <PlusIcon data-icon="inline-start" />
              ) : (
                <FolderUp data-icon="inline-start" className="size-8" />
              )}
              {isDragging ? t('releaseToAdd') : hasFiles ? t('addMore') : t('dropHint')}
            </Button>
            {files.length > 3 ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                disabled={pending}
                aria-label={t('clearAll')}
                onClick={() => {
                  setFiles([]);
                  setFileProgress({});
                }}
              >
                <Trash2Icon />
              </Button>
            ) : null}
          </ButtonGroup>
        </Field>
        {hasFiles ? (
          <ScrollArea className="min-h-0 flex-1">
            <AttachmentGroup className="flex-col p-1">
              {files.map((file) => {
                const key = fileKey(file);
                const percent = fileProgress[key];
                const uploading = pending && percent !== undefined && percent < 100;
                const uploaded = pending && percent === 100;
                return (
                  <Attachment
                    key={key}
                    className="w-full"
                    state={uploading ? 'uploading' : uploaded ? 'done' : pending ? 'idle' : 'done'}
                  >
                    <AttachmentMedia>{uploading ? <Spinner /> : <FileIcon />}</AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{file.name}</AttachmentTitle>
                      <AttachmentDescription>
                        {uploading ? t('uploadingFile', { percent }) : formatBytes(file.size)}
                      </AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction
                        type="button"
                        aria-label={t('removeFile', { name: file.name })}
                        disabled={pending}
                        onClick={() =>
                          setFiles((current) => current.filter((item) => item !== file))
                        }
                      >
                        <XIcon />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                );
              })}
            </AttachmentGroup>
          </ScrollArea>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-4 pt-4">
        <FieldGroup className="grid grid-cols-2 gap-4">
          <Field className="col-span-2 lg:col-span-1">
            <FieldLabel htmlFor="send-code" className="sr-only">
              {t('sendCode')}
            </FieldLabel>
            <InputGroup className="h-11 border-none">
              <InputGroupAddon>
                <InputGroupText>{t('sendCode')}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="send-code"
                type="text"
                autoComplete="off"
                value={sendCode}
                onChange={(event) => setSendCode(event.target.value)}
                required
              />
            </InputGroup>
          </Field>
          <Field className="col-span-2 lg:col-span-1">
            <FieldLabel htmlFor="receive-password" className="sr-only">
              {t('receivePassword')}
            </FieldLabel>
            <InputGroup className="h-11 border-none">
              <InputGroupAddon>
                <InputGroupText>{t('password')}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="receive-password"
                type="text"
                autoComplete="off"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="max-downloads" className="sr-only">
              {t('downloadLimit')}
            </FieldLabel>
            <InputGroup className="h-11 border-none">
              <InputGroupAddon>
                <InputGroupText>{t('downloads')}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="max-downloads"
                type="number"
                min={1}
                max={10000}
                value={maxDownloads}
                onChange={(event) => setMaxDownloads(event.target.value)}
                required
                className="text-center"
              />
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="expires" className="sr-only">
              {t('expires')}
            </FieldLabel>
            <InputGroup className="h-11 border-none">
              <InputGroupAddon>
                <InputGroupText>{t('expires')}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="expires"
                type="number"
                min={1}
                max={expireUnit === 'd' ? 30 : 720}
                value={expireAmount}
                onChange={(event) => setExpireAmount(event.target.value)}
                required
                className="text-center"
              />
              <InputGroupAddon align="inline-end">
                <Select
                  items={[...expireUnits]}
                  value={expireUnit}
                  onValueChange={(value) => {
                    const unit = value === 'd' ? 'd' : 'h';
                    setExpireUnit(unit);
                    if (unit === 'd') {
                      setExpireAmount('1');
                    }
                  }}
                >
                  <SelectTrigger size="sm" className="border-0 bg-transparent px-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} align="end">
                    <SelectGroup>
                      {expireUnits.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>

        {/* {error ? <FieldError>{error}</FieldError> : null} */}

        <Button type="submit" disabled={pending} className="mt-4 w-2/3 self-center py-6 text-lg">
          {pending ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
