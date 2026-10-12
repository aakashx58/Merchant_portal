import { computed, inject, Injectable, signal } from '@angular/core';
import { PermissionEnum } from '../../../core/constants/permission.enum';
import { Application } from '../../../core/models/application.model';
import { ApplicationAssignmentService } from '../../../core/services/application-assignment.service';
import { ApplicationQuery, ApplicationsService } from '../../../core/services/applications.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { ListStore } from '../../../core/state';

@Injectable({ providedIn: 'root' })
export class AdminAssignmentsStore extends ListStore<Application, ApplicationQuery> {
  private readonly api = inject(ApplicationsService);
  private readonly assignmentApi = inject(ApplicationAssignmentService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly statuses = ['draft', 'submitted', 'approved', 'rejected'] as const;
  readonly applications = this.data;
  readonly reviewers = signal<{ id: string; username: string }[]>([]);

  readonly canAssign = computed(() => this.auth.can(PermissionEnum.application_assign));

  readonly columns = computed(() => [
    { key: 'businessName', header: 'Business', sortable: true },
    { key: 'contactName', header: 'Contact' },
    { key: 'status', header: 'Status' },
    { key: 'monthlyVolume', header: 'Monthly Volume', sortable: true },
    { key: 'updatedAt', header: 'Updated', sortable: true },
    { key: 'assigneeName', header: 'Reviewer' },
    { key: 'actions', header: 'Action' },
  ]);

  constructor() {
    super(
      { page: 1, pageSize: 10, status: '', q: '', sort: 'updatedAt', dir: 'desc' },
      { sort: 'updatedAt', dir: 'desc' },
      'Failed to load applications',
    );
    this.loadReviewers();
    this.load();
  }

  protected fetch(query: ApplicationQuery) {
    return this.api.list(query);
  }

  loadReviewers() {
    this.assignmentApi.reviewers().subscribe({
      next: (reviewers) => this.reviewers.set(reviewers),
      error: () => {
        this.reviewers.set([]);
        this.toast.show('Could not load the reviewer list');
      },
    });
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

  assignReviewer(applicationId: string, reviewerId: string) {
    this.assignmentApi.assign(applicationId, reviewerId).subscribe({
      next: () => {
        this.toast.show('Reviewer assigned');
        this.reload();
      },
      error: () => this.toast.show('Failed to assign reviewer'),
    });
  }
}
