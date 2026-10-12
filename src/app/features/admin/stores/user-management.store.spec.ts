import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { UserManagementStore } from './user-management.store';
import { UserService } from '../services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';

describe('UserManagementStore', () => {
  let store: UserManagementStore;
  let list: ReturnType<typeof vi.fn>;
  let updateRole: ReturnType<typeof vi.fn>;
  let toast: { show: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    list = vi
      .fn()
      .mockReturnValue(
        of({ items: [{ id: 'u1' }], total: 1, page: 1, pageSize: 10, totalPages: 1 }),
      );
    updateRole = vi.fn().mockReturnValue(of({}));
    toast = { show: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: { list, updateRole } },
        { provide: AuthService, useValue: { can: () => true } },
        { provide: DialogService, useValue: { openSideSheet: vi.fn() } },
        { provide: ToastService, useValue: toast },
      ],
    });
    store = TestBed.inject(UserManagementStore);
  });

  it('loads on construction and again on every filter / page change', () => {
    expect(list).toHaveBeenCalledTimes(1);
    store.setRole('admin');
    store.onPage({ page: 2, pageSize: 10 });
    expect(list).toHaveBeenCalledTimes(3);
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'admin', page: 2 }));
  });

  it('load() stores users', () => {
    store.load();
    expect(store.users()?.total).toBe(1);
    expect(store.loading()).toBe(false);
  });

  it('load() reports errors', () => {
    list.mockReturnValue(throwError(() => new Error('bad')));
    store.load();
    expect(store.error()).toBe('bad');
  });

  it('setRole filters and resets the page', () => {
    store.onPage({ page: 3, pageSize: 10 });
    store.setRole('admin');
    expect(store.query()).toMatchObject({ role: 'admin', page: 1 });
  });

  it('onSort falls back to username asc when cleared', () => {
    store.onSort({ sort: 'createdAt', dir: 'desc' });
    expect(store.query()).toMatchObject({ sort: 'createdAt', dir: 'desc' });
    store.onSort({ sort: 'createdAt', dir: '' });
    expect(store.query()).toMatchObject({ sort: 'username', dir: 'asc' });
  });

  it('toggleRole updates then reloads', () => {
    list.mockClear();
    store.toggleRole('u1', 'admin');
    expect(updateRole).toHaveBeenCalledWith('u1', 'admin');
    expect(toast.show).toHaveBeenCalledWith('Role updated');
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('toggleRole surfaces a failure', () => {
    updateRole.mockReturnValue(throwError(() => new Error('x')));
    store.toggleRole('u1', 'admin');
    expect(toast.show).toHaveBeenCalledWith('Failed to update role');
  });
});
