/**
 * Thrown by both the mock and (future) real service implementations so
 * components can handle failures the same way regardless of data source.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Every real backend endpoint (via httpClient) wraps its payload in this envelope. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}
