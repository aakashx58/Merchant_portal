import { computed, inject, Injectable } from '@angular/core';
import { PermissionEnum } from '../../../core/constants/permission.enum';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserQuery, UserService } from '../services/user.service';
import { ListStore } from '../../../core/state';
import { TableColumn } from '../../../shared/components/data-table/data-table.component';

@Injectable({ providedIn: 'root' })
export class UserManagementStore extends ListStore<User, UserQuery> {
  private readonly api = inject(UserService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly roles = ['sales', 'reviewer', 'admin'] as const;
  readonly users = this.data;

  readonly canManageUsers = computed(() => this.auth.can(PermissionEnum.user_manage));

  readonly columns = computed<TableColumn[]>(() => [
    { key: 'username', header: 'Username', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'roles', header: 'Roles' },
    { key: 'createdAt', header: 'Created', sortable: true },
    { key: 'actions', header: 'Actions' },
  ]);

  constructor() {
    super(
      { page: 1, pageSize: 10, q: '', role: '', sort: 'username', dir: 'asc' },
      { sort: 'username', dir: 'asc' },
      'Failed to load users',
    );
    this.load();
  }

  protected fetch(query: UserQuery) {
    return this.api.list(query);
  }

  setRole(role: UserQuery['role']) {
    this.patch({ role });
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
      next: () => {
        this.toast.show('Role updated');
        this.reload();
      },
      error: () => this.toast.show('Failed to update role'),
    });
  }
}
