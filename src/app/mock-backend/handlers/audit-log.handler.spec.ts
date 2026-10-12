import { HttpParams, HttpRequest } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { auditLogs, MockUser, users } from '../mock-db';
import { handleAuditLogs } from './audit-log.handler';

const user = (id: string) => users.find((u) => u.id === id) as MockUser;
const get = (u: MockUser, params: Record<string, string> = {}) =>
  handleAuditLogs(
    new HttpRequest('GET', '/audit-logs', { params: new HttpParams({ fromObject: params }) }),
    '/audit-logs',
    u,
  )!;

interface Body {
  items: { action: string; severity: string; actorId: string; actorName: string; at: string }[];
  total: number;
}

describe('audit log handler', () => {
  it('only admins can read it', () => {
    expect(get(user('u-sales')).status).toBe(403);
    expect(get(user('u-reviewer')).status).toBe(403);
    expect(get(user('u-admin')).status).toBe(200);
  });

  it('pages results and reports the total', () => {
    const body = get(user('u-admin'), { page: '2', pageSize: '5' }).body as Body;
    expect(body.items.length).toBe(5);
    expect(body.total).toBe(auditLogs.length);
  });

  it('filters by action, severity and actor', () => {
    const admin = user('u-admin');
    const byAction = get(admin, { action: 'login', pageSize: '100' }).body as Body;
    expect(byAction.items.every((e) => e.action === 'login')).toBe(true);
    const bySeverity = get(admin, { severity: 'error', pageSize: '100' }).body as Body;
    expect(bySeverity.items.every((e) => e.severity === 'error')).toBe(true);
    const byActor = get(admin, { actorId: 'u-sales', pageSize: '100' }).body as Body;
    expect(byActor.items.every((e) => e.actorId === 'u-sales')).toBe(true);
  });

  it('filters by date range', () => {
    const start = new Date(Date.now() - 5 * 86_400_000).toISOString();
    const body = get(user('u-admin'), { startDate: start, pageSize: '100' }).body as Body;
    expect(body.items.every((e) => e.at >= start)).toBe(true);
  });

  it('sorts without reordering the shared data', () => {
    const before = auditLogs.map((e) => e.id).join();
    const body = get(user('u-admin'), { sort: 'actorName', dir: 'asc', pageSize: '100' })
      .body as Body;
    const names = body.items.map((e) => e.actorName);
    expect(names).toEqual([...names].sort());
    expect(auditLogs.map((e) => e.id).join()).toBe(before);
  });
});
