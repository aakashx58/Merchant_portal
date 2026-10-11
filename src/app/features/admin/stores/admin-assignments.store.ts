import { Injectable, signal, computed, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { ApplicationQuery, ApplicationsService } from '../../../core/services/applications.service';
import { ApplicationAssignmentService } from '../../../core/services/application-assignment.service';
import { DialogService } from '../../../core/services/dialog.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { PermissionEnum } from '../../../core/constants/permission.enum';
import { Application, Page } from '../../../core/models/application.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminAssignmentsStore {
  private readonly api = inject(ApplicationsService);
  private readonly assignmentApi = inject(ApplicationAssignmentService);
  readonly auth = inject(AuthService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly statuses = ['draft', 'submitted', 'approved', 'rejected'] as const;

  readonly query = signal<ApplicationQuery>({
    page: 1,
    pageSize: 10,
    status: '',
    q: '',
    sort: 'updatedAt',
    dir: 'desc',
  });

  readonly applications = signal<Page<Application> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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

  readonly PermissionEnum = PermissionEnum;

  readonly reviewers = signal<Array<{ id: string; username: string }>>([]);

  constructor() {
    this.search.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
        tap((searchTerm) => this.patch({ q: searchTerm.trim() }))
      )
      .subscribe();

    this.loadReviewers();
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.list(this.query()).subscribe({
      next: (page) => {
        this.applications.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Failed to load applications');
      },
    });
  }

  loadReviewers() {
    this.assignmentApi.reviewers().subscribe({
      next: (reviewers) => this.reviewers.set(reviewers),
      error: () => this.reviewers.set([]),
    });
  }

  reload() {
    this.load();
  }

  setStatus(status: ApplicationQuery['status']) {
    this.patch({ status });
  }

  onSort({ sort, dir }: { sort: string; dir: 'asc' | 'desc' | '' }) {
    this.patch(dir ? { sort, dir } : { sort: 'updatedAt', dir: 'desc' });
  }

  onPage({ page, pageSize }: { page: number; pageSize: number }) {
    this.query.update((q) => ({ ...q, page, pageSize }));
  }

  private patch(change: Partial<ApplicationQuery>) {
    this.query.update((q) => ({ ...q, ...change, page: 1 }));
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