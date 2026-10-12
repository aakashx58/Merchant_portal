import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { DashboardStore } from './dashboard.store';
import { ApplicationsService } from '../../../core/services/applications.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { PermissionEnum } from '../../../core/constants/permission.enum';

describe('DashboardStore', () => {
  let list: ReturnType<typeof vi.fn>;
  let counts: ReturnType<typeof vi.fn>;
  let perms: Set<PermissionEnum>;

  const create = () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ApplicationsService, useValue: { list, counts } },
        { provide: AuthService, useValue: { can: (p: PermissionEnum) => perms.has(p) } },
        { provide: DialogService, useValue: { openSideSheet: vi.fn() } },
      ],
    });
    return TestBed.inject(DashboardStore);
  };

  beforeEach(() => {
    perms = new Set();
    counts = vi
      .fn()
      .mockReturnValue(of({ draft: 1, submitted: 2, approved: 3, rejected: 4, total: 10 }));
    list = vi
      .fn()
      .mockReturnValue(
        of({ items: [{ id: '1' }], total: 1, page: 1, pageSize: 10, totalPages: 1 }),
      );
  });

  it('loads applications on construction', () => {
    const store = create();
    expect(list).toHaveBeenCalledTimes(1);
    expect(store.applications()?.total).toBe(1);
    expect(store.loading()).toBe(false);
  });

  it('exposes the error message when loading fails', () => {
    list.mockReturnValue(throwError(() => new Error('nope')));
    const store = create();
    expect(store.error()).toBe('nope');
    expect(store.applications()).toBeNull();
  });

  it('hides the reviewer column without assign permission', () => {
    const store = create();
    expect(store.columns().map((c) => c.key)).not.toContain('assigneeName');
  });

  it('shows the reviewer column with assign permission', () => {
    perms.add(PermissionEnum.application_assign);
    const store = create();
    const keys = store.columns().map((c) => c.key);
    expect(keys).toContain('assigneeName');
    expect(keys.at(-1)).toBe('actions');
  });

  it('reload() re-queries with the current query', () => {
    const store = create();
    store.setStatus('approved');
    store.reload();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'approved', page: 1 }));
  });

  it('onSort / onPage update the query', () => {
    const store = create();
    store.onSort({ sort: 'monthlyVolume', dir: 'asc' });
    expect(store.query()).toMatchObject({ sort: 'monthlyVolume', dir: 'asc' });
    store.onSort({ sort: 'monthlyVolume', dir: '' });
    expect(store.query()).toMatchObject({ sort: 'updatedAt', dir: 'desc' });
    store.onPage({ page: 3, pageSize: 50 });
    expect(store.query()).toMatchObject({ page: 3, pageSize: 50 });
  });

  it('debounces search into a trimmed q', () => {
    const store = create();
    vi.useFakeTimers();
    store.search.setValue(' foo ');
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    expect(store.query().q).toBe('foo');
  });

  describe('status counts', () => {
    it('are not requested without the dashboard_counts permission', () => {
      const store = create();
      expect(counts).not.toHaveBeenCalled();
      expect(store.counts()).toBeNull();
    });

    it('load on construction and refresh on reload when permitted', () => {
      perms.add(PermissionEnum.dashboard_counts);
      const store = create();
      expect(store.counts()?.total).toBe(10);
      store.reload();
      expect(counts).toHaveBeenCalledTimes(2);
    });

    it('stay hidden when the request fails', () => {
      perms.add(PermissionEnum.dashboard_counts);
      counts.mockReturnValue(throwError(() => new Error('x')));
      expect(create().counts()).toBeNull();
    });
  });
});
