import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';
import { LoggerService } from '../../core/services/logger.service';
import { Application } from '../../core/models/application.model';
import { applications, MockUser, users } from '../mock-db';
import { handleApplicationsCollection } from './applications-collection.handler';
import { handleApplicationsItem } from './applications-item.handler';

const user = (id: string) => users.find((u) => u.id === id) as MockUser;
const logger = { info: vi.fn() } as unknown as LoggerService;

const list = (u: MockUser, params: Record<string, string> = {}) =>
  handleApplicationsCollection(
    new HttpRequest('GET', '/applications', { params: new HttpParams({ fromObject: params }) }),
    '/applications',
    u,
  )!;

const item = (
  u: MockUser,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) =>
  handleApplicationsItem(
    new HttpRequest(method as 'GET', path, body ?? null, { headers: new HttpHeaders(headers) }),
    path,
    u,
    logger,
  )!;

const submittedFor = (assigneeId: string) =>
  applications.find((a) => a.status === 'submitted' && a.assigneeId === assigneeId) as Application;

describe('applications collection', () => {
  it('sales sees only their own applications', () => {
    const items = (list(user('u-sales'), { pageSize: '100' }).body as { items: Application[] })
      .items;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((a) => a.ownerId === 'u-sales')).toBe(true);
  });

  it('reviewer sees only applications assigned to them', () => {
    const items = (list(user('u-reviewer'), { pageSize: '100' }).body as { items: Application[] })
      .items;
    expect(items.every((a) => a.assigneeId === 'u-reviewer')).toBe(true);
  });

  it('admin sees everything and gets paging, filter and search', () => {
    const all = list(user('u-admin'), { pageSize: '100' }).body as { total: number };
    expect(all.total).toBe(applications.length);
    const page = list(user('u-admin'), { page: '2', pageSize: '5', status: 'approved' }).body as {
      items: Application[];
      total: number;
      page: number;
    };
    expect(page.page).toBe(2);
    expect(page.items.length).toBeLessThanOrEqual(5);
    expect(page.items.every((a) => a.status === 'approved')).toBe(true);
    const search = list(user('u-admin'), { q: 'globex' }).body as { items: Application[] };
    expect(search.items.every((a) => a.businessName.toLowerCase().includes('globex'))).toBe(true);
  });

  it('masks sensitive fields in list results', () => {
    const items = (list(user('u-admin')).body as { items: Application[] }).items;
    expect(items.every((a) => a.taxId.includes('*') && a.accountNumber.includes('*'))).toBe(true);
  });

  it('only sales and admin can create; the new draft belongs to the creator', () => {
    const create = (u: MockUser) =>
      handleApplicationsCollection(
        new HttpRequest('POST', '/applications', {}),
        '/applications',
        u,
      )!;
    expect(create(user('u-reviewer')).status).toBe(403);
    const r = create(user('u-sales'));
    expect(r.status).toBe(201);
    expect((r.body as Application).ownerId).toBe('u-sales');
    expect((r.body as Application).status).toBe('draft');
  });

  it('counts by status are scoped to what each role may see and add up to the total', () => {
    const counts = (u: MockUser) =>
      handleApplicationsCollection(
        new HttpRequest('GET', '/applications/counts'),
        '/applications/counts',
        u,
      )!.body as Record<string, number>;
    const admin = counts(user('u-admin'));
    expect(admin['total']).toBe(applications.length);
    expect(admin['draft'] + admin['submitted'] + admin['approved'] + admin['rejected']).toBe(
      admin['total'],
    );
    const own = applications.filter((a) => a.ownerId === 'u-sales').length;
    expect(counts(user('u-sales'))['total']).toBe(own);
    const assigned = applications.filter((a) => a.assigneeId === 'u-reviewer').length;
    expect(counts(user('u-reviewer'))['total']).toBe(assigned);
  });

  it('check-tax-id reports a taken value and excludes the current draft', () => {
    const app = applications.find((a) => a.ownerId === 'u-sales')!;
    const check = (exclude: string) =>
      handleApplicationsCollection(
        new HttpRequest('GET', '/applications/check-tax-id', {
          params: new HttpParams({ fromObject: { value: app.taxId, exclude } }),
        }),
        '/applications/check-tax-id',
        user('u-sales'),
      )!.body as { available: boolean };
    expect(check('other').available).toBe(false);
    expect(check(app.id).available).toBe(true);
  });
});

describe('applications item', () => {
  it('404 for unknown ids and 403 when the user cannot see the application', () => {
    expect(item(user('u-admin'), 'GET', '/applications/nope').status).toBe(404);
    const foreign = applications.find((a) => a.ownerId === 'u-sales2')!;
    expect(item(user('u-sales'), 'GET', `/applications/${foreign.id}`).status).toBe(403);
  });

  it('GET returns the application masked', () => {
    const r = item(user('u-admin'), 'GET', '/applications/app-2');
    expect((r.body as Application).taxId).toContain('*');
  });

  it('only the owner can edit a draft, and a stale version is rejected', () => {
    const draft = applications.find((a) => a.status === 'draft' && a.ownerId === 'u-sales')!;
    const put = (u: MockUser, version: number) =>
      item(
        u,
        'PUT',
        `/applications/${draft.id}`,
        { businessName: 'New' },
        { 'If-Match': `"${version}"` },
      );
    expect(put(user('u-reviewer'), draft.version).status).toBe(403);
    expect(put(user('u-sales'), draft.version + 5).status).toBe(412);
    expect(put(user('u-sales'), draft.version).status).toBe(200);
    expect(draft.businessName).toBe('New');
  });

  it('only admins can assign, and only to a reviewer', () => {
    const app = submittedFor('u-reviewer');
    const assign = (u: MockUser, assigneeId: string) =>
      item(u, 'PUT', `/applications/${app.id}/assignment`, { assigneeId });
    expect(assign(user('u-reviewer'), 'u-reviewer2').status).toBe(403);
    expect(assign(user('u-admin'), 'u-sales').status).toBe(400);
    expect(assign(user('u-admin'), 'u-reviewer').status).toBe(200);
  });

  describe('decision', () => {
    const decide = (u: MockUser, id: string, body: object, key?: string) =>
      item(u, 'POST', `/applications/${id}/decision`, body, key ? { 'Idempotency-Key': key } : {});
    const valid = { decision: 'approved', riskLevel: 'low', note: 'ok' };

    it('sales and admin cannot decide', () => {
      const app = submittedFor('u-reviewer');
      expect(decide(user('u-admin'), app.id, valid).status).toBe(403);
      expect(decide(user('u-sales'), app.id, valid).status).toBe(403);
    });

    it('only the assigned reviewer can decide', () => {
      const app = submittedFor('u-reviewer');
      expect(decide(user('u-reviewer2'), app.id, valid).status).toBe(403);
    });

    it('validates decision, note and risk level', () => {
      const app = submittedFor('u-reviewer');
      const r = user('u-reviewer');
      expect(decide(r, app.id, { ...valid, decision: 'maybe' }).status).toBe(400);
      expect(decide(r, app.id, { ...valid, note: '  ' }).status).toBe(400);
      expect(decide(r, app.id, { ...valid, riskLevel: 'extreme' }).status).toBe(400);
    });

    it('records the decision once and replays the same reply for the same idempotency key', () => {
      const app = submittedFor('u-reviewer');
      const r = user('u-reviewer');
      const first = decide(r, app.id, valid, 'k1');
      expect(first.status).toBe(200);
      expect(app.status).toBe('approved');
      const replay = decide(r, app.id, valid, 'k1');
      expect(replay).toBe(first);
      expect(decide(r, app.id, valid, 'k2').status).toBe(409);
    });
  });

  describe('reveal', () => {
    const reveal = (u: MockUser, field: string) =>
      item(u, 'POST', '/applications/app-2/reveal', { field });

    it('sales cannot reveal', () => {
      expect(reveal(user('u-sales'), 'taxId').status).toBe(403);
    });

    it('admin and reviewer get the real value, only for known fields', () => {
      const app = applications.find((a) => a.id === 'app-2')!;
      const r = reveal(user('u-admin'), 'taxId');
      expect(r.status).toBe(200);
      expect((r.body as { value: string }).value).toBe(app.taxId);
      expect(reveal(user('u-admin'), 'password').status).toBe(400);
    });
  });
});
