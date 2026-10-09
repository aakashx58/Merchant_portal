import { describe, expect, it } from 'vitest';
import { authGuard } from './auth.guard';
import { setupGuardTest } from './guard-testing';

describe('authGuard', () => {
  it('sends anonymous users to login and remembers where they were going', () => {
    const { run, url } = setupGuardTest({ isAuthenticated: () => false });
    expect(url(run(authGuard, '/wizard'))).toBe('/login?returnUrl=%2Fwizard');
  });

  it('lets signed-in users through', () => {
    const { run } = setupGuardTest({ isAuthenticated: () => true });
    expect(run(authGuard)).toBe(true);
  });
});
