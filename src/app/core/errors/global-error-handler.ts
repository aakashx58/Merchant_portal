import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, inject, Injectable, NgZone } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(ToastService);
  private readonly zone = inject(NgZone);
  private readonly logger = inject(LoggerService);

  handleError(error: unknown): void {
    this.logger.error('Global error caught', error);
    // HTTP failures are already reported by the HTTP error interceptor.
    if (error instanceof HttpErrorResponse) return;
    this.zone.run(() => this.toast.show('Something went wrong. Please try again.'));
  }
}
