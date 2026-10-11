import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const isAuthCall = (req: HttpRequest<unknown>) =>
  req.url.endsWith('/auth/login') || req.url.endsWith('/auth/refresh');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isAuthCall(req)) return next(req);

  const auth = inject(AuthService);
  const withToken = (token: string | null) =>
    token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const sentWith = auth.token();

  const retry = (token: string) =>
    next(withToken(token)).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) auth.logout();
        return throwError(() => err);
      }),
    );

  return next(withToken(sentWith)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);
      const current = auth.token();
      // Another request already refreshed while this one was in flight.
      if (current && current !== sentWith) return retry(current);
      return auth.refresh().pipe(switchMap(retry));
    }),
  );
};
