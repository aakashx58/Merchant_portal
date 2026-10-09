/* eslint-disable @typescript-eslint/no-explicit-any -- dev-only mock parsing untyped request bodies */
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHeaders,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { mergeMap, Observable, of, throwError, timer } from 'rxjs';
import { PermissionEnum } from '../enums/permission.enum';
import { RoleEnum } from '../enums/role.enum';
import { Application, HistoryEntry, SensitiveField } from '../models/application.model';
import { hasPermission } from '../utils/permission.utils';
import {
  accessTokens,
  applications,
  isMasked,
  mask,
  MockUser,
  refreshTokens,
  revealLog,
  saveTokens,
  userName,
  users,
} from './mock-db';
import { mockToggles } from './mock-toggles';

interface Reply {
  status: number;
  body?: unknown;
  headers?: HttpHeaders;
}

const ok = (body: unknown, headers?: HttpHeaders): Reply => ({ status: 200, body, headers });
const fail = (status: number, message: string): Reply => ({ status, body: { message } });
const etag = (a: Application) => new HttpHeaders({ ETag: `"${a.version}"` });
const newToken = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function issueTokens(user: MockUser) {
  const token = newToken('at');
  const refreshToken = newToken('rt');
  accessTokens.set(token, user.id);
  refreshTokens.set(refreshToken, user.id);
  saveTokens();
  return { token, refreshToken };
}

export function expireAccessTokens() {
  accessTokens.clear();
  saveTokens();
}

function currentUser(req: HttpRequest<unknown>): MockUser | undefined {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const id = token && accessTokens.get(token);
  return users.find((u) => u.id === id);
}

const can = (u: MockUser, p: PermissionEnum) => hasPermission(u.roles, p);
const isAdmin = (u: MockUser) => u.roles.includes(RoleEnum.admin);
const canSee = (u: MockUser, a: Application) =>
  can(u, PermissionEnum.application_view_all) ||
  (can(u, PermissionEnum.application_view_own) && a.ownerId === u.id) ||
  (can(u, PermissionEnum.application_view_assigned) && a.assigneeId === u.id);
const canEdit = (u: MockUser, a: Application) =>
  can(u, PermissionEnum.application_edit) && (a.ownerId === u.id || isAdmin(u));

const decisions = new Map<string, Reply>();

const log = (
  a: Application,
  u: MockUser,
  action: HistoryEntry['action'],
  extra: Partial<HistoryEntry> = {},
) =>
  a.history.push({
    at: new Date().toISOString(),
    actorId: u.id,
    actorName: u.username,
    action,
    ...extra,
  });

const touch = (a: Application) => {
  a.version++;
  a.updatedAt = new Date().toISOString();
  return ok(mask(a), etag(a));
};

function handle(req: HttpRequest<unknown>, url: URL): Reply {
  if (mockToggles.force500) return fail(500, 'Internal server error');

  const path = url.pathname.slice('/api'.length);
  const body = (req.body ?? {}) as Record<string, any>;

  if (req.method === 'POST' && path === '/auth/login') {
    const user = users.find(
      (u) => u.username === body['username'] && u.password === body['password'],
    );
    if (!user) return fail(401, 'Invalid credentials');
    return ok({ id: user.id, username: user.username, roles: user.roles, ...issueTokens(user) });
  }

  if (req.method === 'POST' && path === '/auth/refresh') {
    const user = users.find((u) => u.id === refreshTokens.get(body['refreshToken']));
    if (!user || mockToggles.refreshFails) return fail(401, 'Refresh token invalid');
    refreshTokens.delete(body['refreshToken']);
    saveTokens();
    return ok(issueTokens(user));
  }

  const user = currentUser(req);
  if (!user) return fail(401, 'Unauthorized');

  if (path === '/applications' && req.method === 'GET') {
    if (
      !can(user, PermissionEnum.application_view_own) &&
      !can(user, PermissionEnum.application_view_assigned) &&
      !can(user, PermissionEnum.application_view_all)
    )
      return fail(403, 'Forbidden');
    const p = req.params;
    const page = Math.max(1, Number(p.get('page') ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(p.get('pageSize') ?? 10)));
    const status = p.get('status');
    const q = p.get('q')?.toLowerCase();
    const sort = (p.get('sort') ?? 'updatedAt') as keyof Application;
    const dir = p.get('dir') === 'asc' ? 1 : -1;

    const rows = applications
      .filter((a) => canSee(user, a))
      .filter((a) => p.get('mine') !== 'true' || a.ownerId === user.id)
      .filter((a) => !status || a.status === status)
      .filter(
        (a) =>
          !q || a.businessName.toLowerCase().includes(q) || a.contactName.toLowerCase().includes(q),
      )
      .sort((a, b) => (a[sort]! > b[sort]! ? dir : a[sort]! < b[sort]! ? -dir : 0));

    return ok({
      items: rows.slice((page - 1) * pageSize, page * pageSize).map(mask),
      total: rows.length,
      page,
      pageSize,
    });
  }

  if (path === '/applications' && req.method === 'POST') {
    if (!can(user, PermissionEnum.application_create)) return fail(403, 'Forbidden');
    const now = new Date().toISOString();
    const created: Application = {
      id: `app-${applications.length + 1}`,
      ownerId: user.id,
      status: 'draft',
      version: 1,
      businessName: '',
      contactName: '',
      email: '',
      taxId: '',
      accountNumber: '',
      monthlyVolume: 0,
      documentType: '',
      documentName: '',
      assigneeId: null,
      assigneeName: null,
      history: [],
      createdAt: now,
      updatedAt: now,
    };
    log(created, user, 'created');
    applications.push(created);
    return { status: 201, body: mask(created), headers: etag(created) };
  }

  if (path === '/applications/check-tax-id' && req.method === 'GET') {
    const taken = applications.some(
      (a) =>
        canSee(user, a) &&
        a.taxId === req.params.get('value') &&
        a.id !== req.params.get('exclude'),
    );
    return ok({ available: !taken });
  }

  if (path === '/users' && req.method === 'GET') {
    if (!can(user, PermissionEnum.application_assign)) return fail(403, 'Forbidden');
    const role = req.params.get('role');
    return ok(
      users
        .filter((u) => !role || u.roles.includes(role as RoleEnum))
        .map((u) => ({ id: u.id, username: u.username })),
    );
  }

  const m = path.match(/^\/applications\/([^/]+)(?:\/(submit|decision|reveal|assignment))?$/);
  if (!m) return fail(404, 'Not found');
  const app = applications.find((a) => a.id === m[1]);
  if (!app) return fail(404, 'Application not found');
  if (!canSee(user, app)) return fail(403, 'Forbidden');

  switch (`${req.method} ${m[2] ?? ''}`) {
    case 'GET ':
      return ok(mask(app), etag(app));

    case 'PUT ': {
      if (!canEdit(user, app)) return fail(403, 'Forbidden');
      if (app.status !== 'draft') return fail(409, 'Only drafts can be edited');
      if (req.headers.get('If-Match') !== `"${app.version}"`)
        return fail(412, 'Draft was changed elsewhere, reload and retry');
      const editable = [
        'businessName',
        'contactName',
        'email',
        'taxId',
        'accountNumber',
        'monthlyVolume',
        'documentType',
        'documentName',
      ] as const;
      for (const k of editable) {
        // A masked value means "unchanged"; never overwrite real data with the mask.
        if (k in body && !(typeof body[k] === 'string' && isMasked(body[k])))
          (app as any)[k] = body[k];
      }
      return touch(app);
    }

    case 'POST submit':
      if (!canEdit(user, app)) return fail(403, 'Forbidden');
      if (app.status !== 'draft') return fail(409, 'Already submitted');
      if (app.taxId && applications.some((a) => a.id !== app.id && a.taxId === app.taxId))
        return fail(409, 'This application conflicts with an existing one');
      app.status = 'submitted';
      log(app, user, 'submitted');
      return touch(app);

    case 'PUT assignment': {
      if (!can(user, PermissionEnum.application_assign)) return fail(403, 'Forbidden');
      if (app.status !== 'submitted')
        return fail(409, 'Only submitted applications can be assigned');
      const assignee = users.find(
        (u) => u.id === body['assigneeId'] && u.roles.includes(RoleEnum.reviewer),
      );
      if (!assignee) return fail(400, 'Choose a valid reviewer');
      app.assigneeId = assignee.id;
      app.assigneeName = userName(assignee.id);
      log(app, user, 'assigned', { note: `Assigned to ${assignee.username}` });
      return touch(app);
    }

    case 'POST decision': {
      if (!can(user, PermissionEnum.application_review)) return fail(403, 'Forbidden');
      if (app.ownerId === user.id) return fail(403, 'You cannot review your own application');
      if (app.assigneeId !== user.id) return fail(403, 'This application is not assigned to you');
      const key = req.headers.get('Idempotency-Key');
      const previous = key && decisions.get(`${app.id}:${key}`);
      if (previous) return previous;
      if (app.status !== 'submitted') return fail(409, 'Not awaiting review');
      if (body['decision'] !== 'approved' && body['decision'] !== 'rejected')
        return fail(400, 'decision must be approved or rejected');
      if (!String(body['note'] ?? '').trim()) return fail(400, 'A note is required');
      if (!['low', 'medium', 'high'].includes(body['riskLevel']))
        return fail(400, 'A risk level is required');
      app.status = body['decision'];
      app.reviewNote = String(body['note']).trim();
      app.riskLevel = body['riskLevel'];
      log(app, user, body['decision'], { riskLevel: body['riskLevel'], note: app.reviewNote });
      const reply = touch(app);
      if (key) decisions.set(`${app.id}:${key}`, reply);
      return reply;
    }

    case 'POST reveal': {
      if (!can(user, PermissionEnum.sensitive_reveal)) return fail(403, 'Forbidden');
      const f = body['field'] as SensitiveField;
      if (f !== 'taxId' && f !== 'accountNumber') return fail(400, 'Unknown field');
      revealLog.push({
        userId: user.id,
        applicationId: app.id,
        field: f,
        at: new Date().toISOString(),
      });
      console.info('[mock] sensitive reveal', revealLog.at(-1));
      return ok({ field: f, value: app[f] });
    }
  }
  return fail(405, 'Method not allowed');
}

export const mockBackendInterceptor: HttpInterceptorFn = (
  req,
  next,
): Observable<HttpEvent<unknown>> => {
  const url = new URL(req.url, 'http://mock');
  if (!url.pathname.startsWith('/api/')) return next(req);

  return timer(mockToggles.slow ? 5000 : mockToggles.latencyMs).pipe(
    mergeMap(() => {
      const r = handle(req, url);
      return r.status >= 400
        ? throwError(() => new HttpErrorResponse({ status: r.status, error: r.body, url: req.url }))
        : of(new HttpResponse({ status: r.status, body: r.body, headers: r.headers }));
    }),
  );
};
