export class HttpError extends Error {
  status: number;
  details?: any;
  constructor(status: number, message: string, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export function getErrorStatus(err: any): number {
  if (err instanceof HttpError) return err.status;
  if (typeof err.status === 'number') return err.status;
  if (typeof err.statusCode === 'number') return err.statusCode;
  return 500;
}

export function isHttpError(err: any): err is HttpError {
  return err instanceof HttpError;
}
