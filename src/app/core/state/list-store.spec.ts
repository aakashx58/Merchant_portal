import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ListPage, ListQuery, ListStore } from './list-store';

class TestStore extends ListStore<string, ListQuery> {
  readonly fetchFn = vi.fn<(q: ListQuery) => Observable<ListPage<string>>>(() =>
    of({ items: ['a'], total: 1 }),
  );
  constructor() {
    super(
      { page: 1, pageSize: 10, q: '', sort: 'name', dir: 'asc' },
      { sort: 'name', dir: 'asc' },
      'Fallback',
    );
  }
  protected fetch(q: ListQuery) {
    return this.fetchFn(q);
  }
  change(c: Partial<ListQuery>) {
    this.patch(c);
  }
}

const create = () => TestBed.runInInjectionContext(() => new TestStore());

describe('ListStore', () => {
  it('load() stores the page and clears loading/error', () => {
    const s = create();
    s.load();
    expect(s.data()).toEqual({ items: ['a'], total: 1 });
    expect(s.loading()).toBe(false);
    expect(s.error()).toBeNull();
  });

  it('uses the error message, or the fallback when there is none', () => {
    const s = create();
    s.fetchFn.mockReturnValueOnce(throwError(() => new Error('boom')));
    s.load();
    expect(s.error()).toBe('boom');
    s.fetchFn.mockReturnValueOnce(throwError(() => ({})));
    s.load();
    expect(s.error()).toBe('Fallback');
  });

  it('a filter change goes back to page 1 and reloads; paging keeps the page', () => {
    const s = create();
    s.onPage({ page: 3, pageSize: 25 });
    expect(s.query()).toMatchObject({ page: 3, pageSize: 25 });
    s.change({ q: 'x' });
    expect(s.query()).toMatchObject({ q: 'x', page: 1 });
    expect(s.fetchFn).toHaveBeenCalledTimes(2);
  });

  it('onSort falls back to the default sort when cleared', () => {
    const s = create();
    s.onSort({ sort: 'other', dir: 'desc' });
    expect(s.query()).toMatchObject({ sort: 'other', dir: 'desc' });
    s.onSort({ sort: 'other', dir: '' });
    expect(s.query()).toMatchObject({ sort: 'name', dir: 'asc' });
  });

  it('ignores a stale response when a newer load starts', () => {
    const s = create();
    const first = new Subject<ListPage<string>>();
    const second = new Subject<ListPage<string>>();
    s.fetchFn.mockReturnValueOnce(first).mockReturnValueOnce(second);
    s.load();
    s.load();
    first.next({ items: ['stale'], total: 1 });
    second.next({ items: ['fresh'], total: 1 });
    expect(s.data()?.items).toEqual(['fresh']);
  });

  it('debounces search into a trimmed q', () => {
    vi.useFakeTimers();
    const s = create();
    s.search.setValue('  hi ');
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    expect(s.query().q).toBe('hi');
  });
});
