import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';

export interface ListQuery {
  page: number;
  pageSize: number;
  q: string;
  sort: string;
  dir: 'asc' | 'desc';
}

export interface ListPage<T> {
  items: T[];
  total: number;
}

/**
 * Server-side list state shared by every table page: query signal, debounced search,
 * sort/page handlers, and a reload on every query change (stale requests are cancelled).
 * Subclasses provide `fetch` and call `this.load()` from their constructor when the page
 * should load on creation.
 */
export abstract class ListStore<TItem, TQuery extends ListQuery> {
  readonly search = new FormControl('', { nonNullable: true });
  readonly query;
  readonly data = signal<ListPage<TItem> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private inFlight?: Subscription;

  protected constructor(
    initialQuery: TQuery,
    private readonly defaultSort: Pick<ListQuery, 'sort' | 'dir'>,
    private readonly loadErrorMessage: string,
  ) {
    this.query = signal<TQuery>(initialQuery);
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((term) => this.patch({ q: term.trim() } as Partial<TQuery>));
  }

  protected abstract fetch(query: TQuery): Observable<ListPage<TItem>>;

  load(): void {
    this.inFlight?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.inFlight = this.fetch(this.query()).subscribe({
      next: (page) => {
        this.data.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || this.loadErrorMessage);
      },
    });
  }

  reload(): void {
    this.load();
  }

  onSort({ sort, dir }: { sort: string; dir: 'asc' | 'desc' | '' }): void {
    this.patch((dir ? { sort, dir } : this.defaultSort) as Partial<TQuery>);
  }

  onPage({ page, pageSize }: { page: number; pageSize: number }): void {
    this.query.update((q) => ({ ...q, page, pageSize }));
    this.load();
  }

  /** Applies a filter or sort change, goes back to page 1 and reloads. */
  protected patch(change: Partial<TQuery>): void {
    this.query.update((q) => ({ ...q, ...change, page: 1 }));
    this.load();
  }
}
