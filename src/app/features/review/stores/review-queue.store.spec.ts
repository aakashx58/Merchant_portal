import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ReviewQueueStore } from './review-queue.store';
import { ApplicationsService } from '../../../core/services/applications.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';

const app = (id: string, status: string) => ({ id, status }) as never;
const page = (items: never[], total = items.length) => ({
  items,
  total,
  page: 1,
  pageSize: 10,
  totalPages: 1,
});

describe('ReviewQueueStore', () => {
  let store: ReviewQueueStore;
  let list: ReturnType<typeof vi.fn>;
  let counts: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    counts = vi
      .fn()
      .mockReturnValue(of({ draft: 0, submitted: 2, approved: 1, rejected: 1, total: 40 }));
    list = vi
      .fn()
      .mockReturnValue(
        of(
          page(
            [
              app('1', 'submitted'),
              app('2', 'approved'),
              app('3', 'rejected'),
              app('4', 'submitted'),
            ],
            40,
          ),
        ),
      );
    TestBed.configureTestingModule({
      providers: [
        { provide: ApplicationsService, useValue: { list, counts } },
        { provide: AuthService, useValue: { can: () => true } },
        { provide: DialogService, useValue: { openSideSheet: vi.fn() } },
      ],
    });
    store = TestBed.inject(ReviewQueueStore);
  });

  it('defaults to the submitted queue', () => {
    expect(store.query().status).toBe('submitted');
    expect(store.query().page).toBe(1);
  });

  it('load() stores the page and clears loading', () => {
    store.load();
    expect(list).toHaveBeenCalledWith(store.query());
    expect(store.applications()?.items.length).toBe(4);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('load() sets the error message on failure', () => {
    list.mockReturnValue(throwError(() => new Error('boom')));
    store.load();
    expect(store.error()).toBe('boom');
    expect(store.loading()).toBe(false);
  });

  it('load() falls back to a default error message', () => {
    list.mockReturnValue(throwError(() => ({})));
    store.load();
    expect(store.error()).toBe('Failed to load review queue');
  });

  it('KPIs come from the server-side counts, not from the rows on the current page', () => {
    // the table shows only "submitted" rows, yet approved/rejected must still be counted
    expect(store.kpis()).toEqual({ pending: 2, approved: 1, rejected: 1, total: 40 });
  });

  it('KPIs are zero when the counts could not be loaded', () => {
    counts.mockReturnValue(throwError(() => new Error('x')));
    store.loadCounts();
    expect(store.kpis()).toEqual({ pending: 0, approved: 0, rejected: 0, total: 0 });
  });

  it('reload refreshes the counts too, and filtering does not refetch them', () => {
    expect(counts).toHaveBeenCalledTimes(1);
    store.setStatus('approved');
    expect(counts).toHaveBeenCalledTimes(1);
    store.reload();
    expect(counts).toHaveBeenCalledTimes(2);
  });

  it('loads on construction and again on every filter / page change', () => {
    expect(list).toHaveBeenCalledTimes(1);
    store.setStatus('approved');
    store.onPage({ page: 2, pageSize: 10 });
    expect(list).toHaveBeenCalledTimes(3);
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'approved', page: 2 }));
  });

  it('setStatus patches the status and resets to page 1', () => {
    store.onPage({ page: 3, pageSize: 10 });
    store.setStatus('approved');
    expect(store.query()).toMatchObject({ status: 'approved', page: 1 });
  });

  it('onSort applies sort/dir and falls back to updatedAt desc when cleared', () => {
    store.onSort({ sort: 'businessName', dir: 'asc' });
    expect(store.query()).toMatchObject({ sort: 'businessName', dir: 'asc' });
    store.onSort({ sort: 'businessName', dir: '' });
    expect(store.query()).toMatchObject({ sort: 'updatedAt', dir: 'desc' });
  });

  it('onPage changes page and size without resetting the page', () => {
    store.onPage({ page: 2, pageSize: 25 });
    expect(store.query()).toMatchObject({ page: 2, pageSize: 25 });
  });

  it('debounces search into a trimmed q and resets the page', () => {
    vi.useFakeTimers();
    store.onPage({ page: 4, pageSize: 10 });
    store.search.setValue('  acme  ');
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    expect(store.query()).toMatchObject({ q: 'acme', page: 1 });
  });
});
