import { HttpHeaders, HttpRequest } from '@angular/common/http';
import { afterEach, describe, expect, it } from 'vitest';
import { accessTokens, refreshTokens } from '../mock-db';
import { mockToggles } from '../mock-toggles';
import { expireAccessTokens, handleAuth } from './auth.handler';

const post = (path: string, body: unknown, headers?: HttpHeaders) =>
  handleAuth(new HttpRequest('POST', path, body, { headers }), path);

const login = (username = 'sales', password = 'password') =>
  post('/auth/login', { username, password })!;

describe('auth handler', () => {
  afterEach(() => {
    mockToggles.refreshFails = false;
  });

  it('logs in with valid credentials and issues both tokens', () => {
    const r = login();
    const body = r.body as { id: string; roles: string[]; token: string; refreshToken: string };
    expect(r.status).toBe(200);
    expect(body.roles).toEqual(['sales']);
    expect(accessTokens.get(body.token)).toBe(body.id);
    expect(refreshTokens.get(body.refreshToken)).toBe(body.id);
  });

  it('rejects wrong password and unknown user', () => {
    expect(login('sales', 'nope').status).toBe(401);
    expect(login('ghost').status).toBe(401);
  });

  it('refresh rotates the refresh token: it works once, then is rejected', () => {
    const { refreshToken } = login().body as { refreshToken: string };
    const first = post('/auth/refresh', { refreshToken })!;
    expect(first.status).toBe(200);
    expect((first.body as { refreshToken: string }).refreshToken).not.toBe(refreshToken);
    expect(post('/auth/refresh', { refreshToken })!.status).toBe(401);
  });

  it('refresh fails when the toggle is on', () => {
    const { refreshToken } = login().body as { refreshToken: string };
    mockToggles.refreshFails = true;
    expect(post('/auth/refresh', { refreshToken })!.status).toBe(401);
  });

  it('logout removes that user tokens', () => {
    const { token, refreshToken } = login().body as { token: string; refreshToken: string };
    post('/auth/logout', {}, new HttpHeaders({ Authorization: `Bearer ${token}` }));
    expect(accessTokens.has(token)).toBe(false);
    expect(refreshTokens.has(refreshToken)).toBe(false);
  });

  it('expireAccessTokens clears access tokens but keeps refresh tokens', () => {
    const { token, refreshToken } = login().body as { token: string; refreshToken: string };
    expireAccessTokens();
    expect(accessTokens.has(token)).toBe(false);
    expect(refreshTokens.has(refreshToken)).toBe(true);
  });

  it('ignores unrelated routes', () => {
    expect(handleAuth(new HttpRequest('GET', '/users'), '/users')).toBeNull();
  });
});
