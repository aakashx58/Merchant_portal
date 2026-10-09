import { describe, expect, it } from 'vitest';
import { setupGuardTest } from './guard-testing';
import { routeGuard } from './route.guard';

describe('routeGuard', () => {
  it('keeps signed-in users away from the login page', () => {
    const { run, url } = setupGuardTest({ isAuthenticated: () => true });
    expect(url(run(routeGuard))).toBe('/');
  });

  it('lets anonymous users reach the login page', () => {
    const { run } = setupGuardTest({ isAuthenticated: () => false });
    expect(run(routeGuard)).toBe(true);
  });
});
