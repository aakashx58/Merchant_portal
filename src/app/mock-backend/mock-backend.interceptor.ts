 
import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { mergeMap, Observable, of, throwError, timer } from 'rxjs';
import { LoggerService } from '../core/services/logger.service';
import { mockToggles } from './mock-toggles';
import { currentUser, fail, Reply } from './mock-utils';
import { handleAuth } from './handlers/auth.handler';
import { handleUsers } from './handlers/users.handler';
import { handleApplicationsCollection } from './handlers/applications-collection.handler';
import { handleApplicationsItem } from './handlers/applications-item.handler';

export { expireAccessTokens } from './handlers/auth.handler';

function handle(req: HttpRequest<unknown>, url: URL, logger: LoggerService): Reply {
  if (mockToggles.force500) return fail(500, 'Internal server error');

  const path = url.pathname.slice('/api'.length);

  // Unauthenticated routes
  const authReply = handleAuth(req, path);
  if (authReply) return authReply;

  // Authenticated routes require a user
  const user = currentUser(req);
  if (!user) return fail(401, 'Unauthorized');

  const usersReply = handleUsers(req, path, user);
  if (usersReply) return usersReply;

  const applicationsCollectionReply = handleApplicationsCollection(req, path, user);
  if (applicationsCollectionReply) return applicationsCollectionReply;

  const applicationsItemReply = handleApplicationsItem(req, path, user, logger);
  if (applicationsItemReply) return applicationsItemReply;

  return fail(404, 'Not found');
}

export const mockBackendInterceptor: HttpInterceptorFn = (
  req,
  next,
): Observable<HttpEvent<unknown>> => {
  const logger = inject(LoggerService);
  const url = new URL(req.url, 'http://mock');
  if (!url.pathname.startsWith('/api/')) return next(req);

  return timer(mockToggles.slow ? 5000 : mockToggles.latencyMs).pipe(
    mergeMap(() => {
      const reply = handle(req, url, logger);
      return reply.status >= 400
        ? throwError(
            () => new HttpErrorResponse({ status: reply.status, error: reply.body, url: req.url }),
          )
        : of(new HttpResponse({ status: reply.status, body: reply.body, headers: reply.headers }));
    }),
  );
};
