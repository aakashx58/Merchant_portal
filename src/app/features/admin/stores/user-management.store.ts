import { TableColumn } from '../../../shared/components/data-table/data-table.component';

import { Injectable, signal, computed, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { DialogService } from '../../../core/services/dialog.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionEnum } from '../../../core/constants/permission.enum';
import { User, Page } from '../../../core/models/user.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

export interface UserQuery {
  page: number;
  pageSize: number;
  q: string;
  role: string;
  sort: string;
  dir: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class UserManagementStore {
  private readonly api = inject(UserService);
  readonly auth = inject(AuthService);
  private readonly dialog = inject(DialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly roles = ['sales', 'reviewer', 'admin'] as const;

  readonly query = signal<UserQuery>({
    page: 1,
    pageSize: 10,
    q: '',
    role: '',
    sort: 'username',
    dir: 'asc',
  });

  readonly users = signal<Page<User> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly canManageUsers = computed(() => this.auth.can(PermissionEnum.user_manage as PermissionEnum));

  readonly columns = computed<TableColumn[]>(() => [
    { key: 'username', header: 'Username', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'roles', header: 'Roles' },
    { key: 'createdAt', header: 'Created', sortable: true },
    { key: 'actions', header: 'Actions' },
  ]);

  constructor() {
    this.search.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
        tap((searchTerm) => this.patch({ q: searchTerm.trim() }))
      )
      .subscribe();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.list(this.query()).subscribe({
      next: (page) => {
        this.users.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Failed to load users');
      },
    });
  }

  reload() {
    this.load();
  }

  setRole(role: UserQuery['role']) {
    this.patch({ role });
  }

  onSort({ sort, dir }: { sort: string; dir: 'asc' | 'desc' | '' }) {
    this.patch(dir ? { sort, dir } : { sort: 'username', dir: 'asc' });
  }

  onPage({ page, pageSize }: { page: number; pageSize: number }) {
    this.query.update((q) => ({ ...q, page, pageSize }));
  }

  private patch(change: Partial<UserQuery>) {
    this.query.update((q) => ({ ...q, ...change, page: 1 }));
  }

  async openDetails(userId: string) {
    const { UserDetailComponent } = await import('../components/user-detail/user-detail.component');
    this.dialog
      .openSideSheet(UserDetailComponent, { data: { id: userId } })
      .afterClosed()
      .subscribe(() => this.reload());
  }

  toggleRole(userId: string, newRole: string) {
    this.api.updateRole(userId, newRole).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Failed to update role'),
    });
  }
}