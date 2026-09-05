export const errorCodes = [
  'unknown',
  'invalid_json',
  'invalid_request',
  'invalid_send_code',
  'invalid_receive_code',
  'storage_not_configured',
  'receive_code_unavailable',
  'no_files',
  'drop_empty',
  'file_list_mismatch',
  'upload_failed',
  'upload_blocked',
  'finalize_failed',
  'drop_not_found',
  'download_limit_reached',
  'password_required',
  'invalid_password',
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export const successCodes = ['files_sent', 'files_found', 'copied'] as const;

export type SuccessCode = (typeof successCodes)[number];

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly vars?: { file?: string };

  constructor(code: ErrorCode, vars?: { file?: string }) {
    super(code);
    this.name = 'AppError';
    this.code = code;
    this.vars = vars;
  }
}

export function isErrorCode(value: string): value is ErrorCode {
  return (errorCodes as readonly string[]).includes(value);
}

export function errorCodeFrom(value: string | undefined, fallback: ErrorCode): ErrorCode {
  return value && isErrorCode(value) ? value : fallback;
}

export function jsonError(code: ErrorCode, status: number, extra?: Record<string, unknown>) {
  return Response.json({ error: code, ...extra }, { status });
}

export function errorFromUnknown(err: unknown, fallback: ErrorCode = 'unknown') {
  if (err instanceof AppError) {
    return { code: err.code, vars: err.vars };
  }
  if (err instanceof Error && isErrorCode(err.message)) {
    return { code: err.message };
  }
  return { code: fallback };
}

const internalErrorCodes = [
  'upload_blocked',
  'storage_not_configured',
  'receive_code_unavailable',
  'file_list_mismatch',
  'finalize_failed',
] as const;

export function publicErrorCode(code: ErrorCode): ErrorCode {
  return (internalErrorCodes as readonly string[]).includes(code) ? 'unknown' : code;
}
