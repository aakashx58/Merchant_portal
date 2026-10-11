import { describe, expect, it } from 'vitest';
import { PermissionEnum } from '../constants/permission.enum';
import { setupGuardTest } from './guard-testing';
import { permissionGuard } from './permission.guard';

describe('permissionGuard', () => {
  const guard = permissionGuard(PermissionEnum.application_review);

  it('blocks users without the permission', () => {
    const { run, url } = setupGuardTest({ can: () => false });
    expect(url(run(guard))).toBe('/');
  });

  it('lets users with the permission through', () => {
    const { run } = setupGuardTest({ can: () => true });
    expect(run(guard)).toBe(true);
  });
});
