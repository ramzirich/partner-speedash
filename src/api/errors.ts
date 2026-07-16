/**
 * Typed error hierarchy for the API layer.
 *
 * Screens can `catch (e)` and branch on `e instanceof NetworkError` etc.
 * instead of string-matching messages. Every error carries a `userMessage`
 * that is safe to render directly in the UI.
 */

export type ApiErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'SERVER'
  | 'UNKNOWN';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly userMessage: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    options?: { status?: number; userMessage?: string; cause?: unknown },
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options?.status;
    this.userMessage =
      options?.userMessage ?? 'Something went wrong. Please try again.';
    // Preserve original error for logging without leaking it to the UI.
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export class NetworkError extends ApiError {
  constructor(cause?: unknown) {
    super('NETWORK', 'Network request failed', {
      cause,
      userMessage: 'No connection. Check your internet and try again.',
    });
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor(timeoutMs: number) {
    super('TIMEOUT', `Request timed out after ${timeoutMs}ms`, {
      userMessage: 'The request took too long. Please try again.',
    });
    this.name = 'TimeoutError';
  }
}

/** Maps an unknown thrown value into a guaranteed ApiError. */
export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }
  return new ApiError('UNKNOWN', 'Unexpected error', { cause: error });
};
