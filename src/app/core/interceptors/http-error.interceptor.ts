import {
  HttpContext,
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

const HANDLED_INLINE = new HttpContextToken<boolean>(() => false);

/** For requests whose screen already shows its own error state. */
export const handledInline = () => new HttpContext().set(HANDLED_INLINE, true);

const isAuthCall = (url: string) => url.endsWith('/auth/login') || url.endsWith('/auth/refresh');

function messageFor(error: HttpErrorResponse): string | null {
  if (error.status === 0) return 'Cannot reach the server. Check your connection.';
  if (error.status === 401) return 'Your session has expired. Please sign in again.';
  if (error.status === 403) return 'You do not have permission to do that.';
  if (error.status >= 500) return 'The server had a problem. Please try again later.';
  return null;
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const skip = req.context.get(HANDLED_INLINE) || isAuthCall(req.url);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = skip ? null : messageFor(error);
      if (message) toast.show(message);
      return throwError(() => error);
    }),
  );
};
