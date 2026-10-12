import { HttpRequest } from '@angular/common/http';
import { accessTokens, MockUser, refreshTokens, saveTokens, users } from '../mock-db';
import { fail, ok, Reply } from '../mock-utils';
import { mockToggles } from '../mock-toggles';

const newToken = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function issueTokens(user: MockUser) {
  const token = newToken('at');
  const refreshToken = newToken('rt');
  accessTokens.set(token, user.id);
  refreshTokens.set(refreshToken, user.id);
  saveTokens();
  return { token, refreshToken };
}

function clearUserTokens(userId: string) {
  for (const [token, uid] of accessTokens.entries()) {
    if (uid === userId) accessTokens.delete(token);
  }
  for (const [token, uid] of refreshTokens.entries()) {
    if (uid === userId) refreshTokens.delete(token);
  }
  saveTokens();
}

export function expireAccessTokens() {
  accessTokens.clear();
  saveTokens();
}

export function handleAuth(req: HttpRequest<unknown>, path: string): Reply | null {
  const body = (req.body ?? {}) as Record<string, string>;

  if (req.method === 'POST' && path === '/auth/login') {
    const user = users.find(
      (userItem) =>
        userItem.username === body['username'] && userItem.password === body['password'],
    );
    if (!user) return fail(401, 'Invalid credentials');
    return ok({ id: user.id, username: user.username, roles: user.roles, ...issueTokens(user) });
  }

  if (req.method === 'POST' && path === '/auth/refresh') {
    const user = users.find((userItem) => userItem.id === refreshTokens.get(body['refreshToken']));
    if (!user || mockToggles.refreshFails) return fail(401, 'Refresh token invalid');
    refreshTokens.delete(body['refreshToken']);
    saveTokens();
    return ok(issueTokens(user));
  }

  if (req.method === 'POST' && path === '/auth/logout') {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const userId = token && accessTokens.get(token);
    if (userId) {
      clearUserTokens(userId);
    }
    return ok({ success: true });
  }

  return null;
}

export { clearUserTokens };
