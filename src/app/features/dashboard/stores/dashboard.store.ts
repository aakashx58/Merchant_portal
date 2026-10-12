import { computed, inject, Injectable, signal } from '@angular/core';
import { PermissionEnum } from '../../../core/constants/permission.enum';
import { Application, StatusCounts } from '../../../core/models/application.model';
import { ApplicationQuery, ApplicationsService } from '../../../core/services/applications.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ListStore } from '../../../core/state';

@Injectable({ providedIn: 'root' })
export class DashboardStore extends ListStore<Application, ApplicationQuery> {
  private readonly api = inject(ApplicationsService);
  private readonly dialog = inject(DialogService);
  readonly auth = inject(AuthService);

  readonly statuses = ['draft', 'submitted', 'approved', 'rejected'] as const;
  readonly applications = this.data;

  readonly canAssign = computed(() => this.auth.can(PermissionEnum.application_assign));
  readonly canReview = computed(() => this.auth.can(PermissionEnum.application_review));
  readonly canViewCounts = computed(() => this.auth.can(PermissionEnum.dashboard_counts));
  readonly counts = signal<StatusCounts | null>(null);

  readonly columns = computed(() => [
    { key: 'businessName', header: 'Business', sortable: true },
    { key: 'contactName', header: 'Contact' },
    { key: 'status', header: 'Status' },
    { key: 'monthlyVolume', header: 'Monthly volume', sortable: true },
    { key: 'updatedAt', header: 'Updated', sortable: true },
    ...(this.canAssign() ? [{ key: 'assigneeName', header: 'Reviewer' }] : []),
    { key: 'actions', header: 'Action' },
  ]);

  constructor() {
    super(
      { page: 1, pageSize: 10, status: '', q: '', sort: 'updatedAt', dir: 'desc' },
      { sort: 'updatedAt', dir: 'desc' },
      'Failed to load applications',
    );
    this.load();
    this.loadCounts();
  }

  protected fetch(query: ApplicationQuery) {
    return this.api.list(query);
  }

  loadCounts() {
    if (!this.canViewCounts()) return;
    this.api.counts().subscribe({
      next: (counts) => this.counts.set(counts),
      error: () => this.counts.set(null), // the cards simply stay hidden; the table has its own error state
    });
  }

  override reload() {
    super.reload();
    this.loadCounts();
  }

  setStatus(status: ApplicationQuery['status']) {
    this.patch({ status });
  }

  async openDetails(id: string) {
    const { ApplicationDetailComponent } =
      await import('../../review/components/application-detail/application-detail.component');
    this.dialog
      .openSideSheet(ApplicationDetailComponent, { data: { id } })
      .afterClosed()
      .subscribe(() => this.reload());
  }
}
