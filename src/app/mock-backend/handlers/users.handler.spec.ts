import { HttpParams, HttpRequest } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { users } from '../mock-db';
import { handleUsers } from './users.handler';

const admin = users.find((u) => u.id === 'u-admin')!;
const sales = users.find((u) => u.id === 'u-sales')!;
const get = (path: string, params: Record<string, string> = {}) =>
  handleUsers(
    new HttpRequest('GET', path, { params: new HttpParams({ fromObject: params }) }),
    path,
    admin,
  );

describe('users handler', () => {
  it('returns a plain list without paging params (reviewer picker)', () => {
    const r = get('/users', { role: 'reviewer' });
    expect(r?.body).toEqual([
      { id: 'u-reviewer', username: 'reviewer' },
      { id: 'u-reviewer2', username: 'reviewer2' },
    ]);
  });

  it('returns a page with email and roles when paging', () => {
    const body = get('/users', { page: '1', pageSize: '2' })?.body as {
      items: { email: string }[];
      total: number;
    };
    expect(body.items.length).toBe(2);
    expect(body.total).toBe(users.length);
    expect(body.items[0].email).toContain('@');
  });

  it('filters by search and role', () => {
    const body = get('/users', { page: '1', q: 'sales', role: 'sales' })?.body as { total: number };
    expect(body.total).toBe(2);
  });

  it('forbids paged listing without user_manage', () => {
    const req = new HttpRequest('GET', '/users', {
      params: new HttpParams({ fromObject: { page: '1' } }),
    });
    expect(handleUsers(req, '/users', sales)?.status).toBe(403);
  });

  it('gets a user and 404s on unknown ids', () => {
    expect(get('/users/u-sales')?.status).toBe(200);
    expect(get('/users/nope')?.status).toBe(404);
  });

  it('changes a role and rejects invalid ones', () => {
    const patch = (role: string) =>
      handleUsers(
        new HttpRequest('PATCH', '/users/u-sales2/role', { role }),
        '/users/u-sales2/role',
        admin,
      );
    expect(patch('bogus')?.status).toBe(400);
    expect(patch('reviewer')?.status).toBe(200);
    expect(users.find((u) => u.id === 'u-sales2')?.roles).toEqual(['reviewer']);
    patch('sales');
  });

  it('does not let an admin change their own role (they would lock themselves out)', () => {
    const r = handleUsers(
      new HttpRequest('PATCH', '/users/u-admin/role', { role: 'sales' }),
      '/users/u-admin/role',
      admin,
    );
    expect(r?.status).toBe(409);
    expect(admin.roles).toEqual(['admin']);
  });
});
