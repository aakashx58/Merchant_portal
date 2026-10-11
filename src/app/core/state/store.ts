import { computed, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { catchError, EMPTY, Observable, tap } from 'rxjs';

export interface BaseState {
  loading: boolean;
  error: string | null;
}

@Injectable()
export abstract class BaseStore<TState extends BaseState> {
  protected readonly _state: WritableSignal<TState>;

  protected constructor(initialState: TState) {
    this._state = signal(initialState);
  }

  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly isLoading = computed(() => this._state().loading);
  readonly hasError = computed(() => this._state().error !== null);

  protected setState(partial: Partial<TState>): void {
    this._state.update(current => ({ ...current, ...partial }));
  }

  protected setLoading(loading: boolean): void {
    this._state.update(current => ({ ...current, loading }));
  }

  protected setError(error: string | null): void {
    this._state.update(current => ({ ...current, error, loading: false }));
  }

  protected clearError(): void {
    this._state.update(current => ({ ...current, error: null }));
  }

  protected reset(): void {
    this._state.set(this.getInitialState());
  }

  protected abstract getInitialState(): TState;

  protected fetch<R>(
    fetchFn: () => Observable<R>,
    options: {
      onSuccess?: (data: R) => void;
      onError?: (error: Error) => void;
    } = {}
  ): void {
    this.setLoading(true);
    this.clearError();

    fetchFn()
      .pipe(
        tap(data => {
          if (options.onSuccess) options.onSuccess(data);
        }),
        catchError(err => {
          const message = err?.message || 'An error occurred';
          this.setError(message);
          if (options.onError) options.onError(err);
          return EMPTY;
        })
      )
      .subscribe();
  }

  protected async fetchAsync<R>(
    fetchFn: () => Promise<R>,
    options: {
      onSuccess?: (data: R) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      const data = await fetchFn();
      if (options.onSuccess) options.onSuccess(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      this.setError(message);
      if (options.onError) options.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export interface EntityStoreState<T> extends BaseState {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export abstract class EntityStore<T> extends BaseStore<EntityStoreState<T>> {
  readonly items = computed(() => this._state().items);
  readonly total = computed(() => this._state().total);
  readonly page = computed(() => this._state().page);
  readonly pageSize = computed(() => this._state().pageSize);
  readonly totalPages = computed(() => Math.ceil(this._state().total / this._state().pageSize));
  readonly hasNextPage = computed(() => this.page() < this.totalPages());
  readonly hasPreviousPage = computed(() => this.page() > 1);

  constructor() {
    super({
      items: [],
      loading: false,
      error: null,
      total: 0,
      page: 1,
      pageSize: 10,
    });
  }

  getInitialState(): EntityStoreState<T> {
    return {
      items: [],
      loading: false,
      error: null,
      total: 0,
      page: 1,
      pageSize: 10,
    };
  }

  protected setItems(items: T[], total?: number): void {
    this._state.update(current => ({
      ...current,
      items,
      total: total ?? current.total,
      loading: false,
      error: null,
    }));
  }

  protected addItem(item: T): void {
    this._state.update(current => ({
      ...current,
      items: [item, ...current.items],
      total: current.total + 1,
    }));
  }

  protected updateItem(id: string | number, updates: Partial<T>, idKey: keyof T = 'id' as keyof T): void {
    this._state.update(current => ({
      ...current,
      items: current.items.map(item => item[idKey] === id ? { ...item, ...updates } : item),
    }));
  }

  protected removeItem(id: string | number, idKey: keyof T = 'id' as keyof T): void {
    this._state.update(current => ({
      ...current,
      items: current.items.filter(item => item[idKey] !== id),
      total: current.total - 1,
    }));
  }

  protected setPage(page: number): void {
    this._state.update(current => ({ ...current, page }));
  }

  protected setPageSize(pageSize: number): void {
    this._state.update(current => ({ ...current, pageSize, page: 1 }));
  }

  protected loadPage(
    fetchFn: (page: number, pageSize: number) => Observable<PaginatedResponse<T>>,
    options: { append?: boolean } = {}
  ): void {
    const { page, pageSize } = this._state();
    this.setLoading(true);
    this.clearError();

    fetchFn(page, pageSize)
      .pipe(
        tap(response => {
          if (options.append) {
            this._state.update(current => ({
              ...current,
              items: [...current.items, ...response.items],
              total: response.total,
              loading: false,
              error: null,
            }));
          } else {
            this._state.update(current => ({
              ...current,
              items: response.items,
              total: response.total,
              loading: false,
              error: null,
            }));
          }
        }),
      catchError(err => {
        this.setError(err?.message || 'Failed to load data');
        return EMPTY;
      })
      )
      .subscribe();
  }

  protected goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.setPage(page);
    }
  }

  protected nextPage(): void {
    if (this.hasNextPage()) {
      this.goToPage(this.page() + 1);
    }
  }

  protected previousPage(): void {
    if (this.hasPreviousPage()) {
      this.goToPage(this.page() - 1);
    }
  }
}

export interface QueryStoreState<T> extends BaseState {
  data: T | null;
  lastFetched: number | null;
}

@Injectable()
export abstract class QueryStore<T> extends BaseStore<QueryStoreState<T>> {
  readonly lastFetched = computed(() => this._state().lastFetched);
  readonly isStale = computed(() => {
    const lastFetched = this._state().lastFetched;
    if (!lastFetched) return true;
    return Date.now() - lastFetched > 5 * 60 * 1000;
  });

  constructor() {
    super({
      data: null,
      loading: false,
      error: null,
      lastFetched: null,
    });
  }

  getInitialState(): QueryStoreState<T> {
    return {
      data: null,
      loading: false,
      error: null,
      lastFetched: null,
    };
  }

  readonly data = computed(() => this._state().data);

  protected fetchQuery<R>(
    fetchFn: () => Observable<R>,
    options: {
      onSuccess?: (data: R) => void;
      onError?: (error: Error) => void;
    } = {}
  ): void {
    this.setLoading(true);
    this.clearError();

    fetchFn()
      .pipe(
        tap(data => {
          this._state.update(current => ({
            ...current,
            data: data as any,
            loading: false,
            error: null,
            lastFetched: Date.now(),
          }));
          if (options.onSuccess) options.onSuccess(data);
        }),
        catchError(err => {
          this.setError(err?.message || 'An error occurred');
          if (options.onError) options.onError(err);
          return EMPTY;
        })
      )
      .subscribe();
  }

  protected async fetchQueryAsync<R>(
    fetchFn: () => Promise<R>,
    options: {
      onSuccess?: (data: R) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      const data = await fetchFn();
      this._state.update(current => ({
        ...current,
        data: data as any,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      }));
      if (options.onSuccess) options.onSuccess(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      this.setError(message);
      if (options.onError) options.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  invalidate(): void {
    this._state.update(current => ({
      ...current,
      lastFetched: null,
    }));
  }

  refetch(): void {
    this.invalidate();
    this.refresh();
  }

  protected abstract refresh(): void;
}

export function createStore<T>(initialState: T): WritableSignal<T> {
  return signal(initialState);
}

export function computedSignal<T>(factory: () => T): Signal<T> {
  return computed(factory);
}