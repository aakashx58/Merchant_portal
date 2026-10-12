import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { UserManagementComponent } from './user-management.component';
import { UserManagementStore } from '../../stores/user-management.store';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { a11yProblems } from '../../../../testing/a11y';

const users = [
  {
    id: 'u1',
    username: 'admin',
    email: 'admin@techkraft.test',
    roles: ['admin'],
    createdAt: '2026-01-01T09:00:00.000Z',
  },
  {
    id: 'u2',
    username: 'sales',
    email: 'sales@techkraft.test',
    roles: ['sales'],
    createdAt: '2026-01-01T09:00:00.000Z',
  },
];

describe('UserManagementComponent', () => {
  const render = async (
    list = vi.fn().mockReturnValue(of({ items: users, total: 2, page: 1, pageSize: 10 })),
  ) => {
    TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: { list, updateRole: vi.fn().mockReturnValue(of({})) } },
        { provide: AuthService, useValue: { can: () => true, user: () => ({ id: 'u1' }) } },
        { provide: DialogService, useValue: { openSideSheet: vi.fn() } },
        { provide: ToastService, useValue: { show: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(UserManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { el: fixture.nativeElement as HTMLElement, list };
  };

  it('shows the data table with a row per user (regression: table was missing)', async () => {
    const { el } = await render();
    expect(el.querySelector('app-data-table')).toBeTruthy();
    expect(el.querySelectorAll('tr[mat-row]').length).toBe(2);
    expect(el.textContent).toContain('sales@techkraft.test');
  });

  it('renders each role as a chip', async () => {
    const { el } = await render();
    expect(Array.from(el.querySelectorAll('.role-chip')).map((c) => c.textContent?.trim())).toEqual(
      ['Admin', 'Sales'],
    );
  });

  it('filters by role through the store', async () => {
    const { list } = await render();
    TestBed.inject(UserManagementStore).setRole('admin');
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'admin', page: 1 }));
  });

  it('shows an error state when loading fails', async () => {
    const { el } = await render(vi.fn().mockReturnValue(throwError(() => new Error('x'))));
    expect(el.textContent).toContain('Failed to load users.');
  });

  it('has no basic accessibility problems', async () => {
    expect(a11yProblems((await render()).el)).toEqual([]);
  });
});
