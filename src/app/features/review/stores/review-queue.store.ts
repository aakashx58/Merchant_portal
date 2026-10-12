import { computed, inject, Injectable } from '@angular/core';
import { PermissionEnum } from '../../../core/constants/permission.enum';
import { Application } from '../../../core/models/application.model';
import { ApplicationQuery, ApplicationsService } from '../../../core/services/applications.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ListStore } from '../../../core/state';

@Injectable({ providedIn: 'root' })
export class ReviewQueueStore extends ListStore<Application, ApplicationQuery> {
  private readonly api = inject(ApplicationsService);
  private readonly dialog = inject(DialogService);
  readonly auth = inject(AuthService);

  readonly statuses = ['submitted', 'approved', 'rejected'] as const;
  readonly applications = this.data;

  readonly canReview = computed(() => this.auth.can(PermissionEnum.application_review));

  readonly columns = computed(() => [
    { key: 'businessName', header: 'Business', sortable: true },
    { key: 'contactName', header: 'Contact' },
    { key: 'status', header: 'Status' },
    { key: 'monthlyVolume', header: 'Monthly Volume', sortable: true },
    { key: 'updatedAt', header: 'Updated', sortable: true },
    { key: 'actions', header: 'Action' },
  ]);

  readonly kpis = computed(() => {
    const items = this.applications()?.items ?? [];
    return {
      pending: items.filter((a) => a.status === 'submitted').length,
      approved: items.filter((a) => a.status === 'approved').length,
      rejected: items.filter((a) => a.status === 'rejected').length,
      total: this.applications()?.total ?? 0,
    };
  });

  constructor() {
    super(
      { page: 1, pageSize: 10, status: 'submitted', q: '', sort: 'updatedAt', dir: 'desc' },
      { sort: 'updatedAt', dir: 'desc' },
      'Failed to load review queue',
    );
    this.load();
  }

  protected fetch(query: ApplicationQuery) {
    return this.api.list(query);
  }

  setStatus(status: ApplicationQuery['status']) {
    this.patch({ status });
  }

  async openDetails(id: string) {
    const { ApplicationDetailComponent } =
      await import('../components/application-detail/application-detail.component');
    this.dialog
      .openSideSheet(ApplicationDetailComponent, { data: { id } })
      .afterClosed()
      .subscribe(() => this.reload());
  }

  startReview(id: string) {
    return this.openDetails(id);
  }
}
