import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);

  handleError(error: unknown): void {
    this.logger.error('Global error caught', error);

    const message = this.extractMessage(error);
    this.toast.show(message);
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      const err = error as { message?: unknown };
      if ('message' in err && typeof err.message === 'string') {
        return err.message;
      }
    }
    return 'An unexpected error occurred';
  }
}
