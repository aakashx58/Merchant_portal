import { Injectable, signal, computed, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { ApplicationQuery, ApplicationsService } from '../../../core/services/applications.service';
import { DialogService } from '../../../core/services/dialog.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionEnum } from '../../../core/constants/permission.enum';
import { Application, Page } from '../../../core/models/application.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReviewQueueStore {
  private readonly api = inject(ApplicationsService);
  readonly auth = inject(AuthService);
  private readonly dialog = inject(DialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  readonly statuses = ['submitted', 'approved', 'rejected'] as const;

  readonly query = signal<ApplicationQuery>({
    page: 1,
    pageSize: 10,
    status: 'submitted',
    q: '',
    sort: 'updatedAt',
    dir: 'desc',
  });

  readonly applications = signal<Page<Application> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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
    const total = this.applications()?.total ?? 0;
    return {
      pending: items.filter(a => a.status === 'submitted').length,
      approved: items.filter(a => a.status === 'approved').length,
      rejected: items.filter(a => a.status === 'rejected').length,
      total,
    };
  });

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
        this.applications.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Failed to load review queue');
      },
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
      await import('../components/application-detail/application-detail.component');
    this.dialog
      .openSideSheet(ApplicationDetailComponent, { data: { id } })
      .afterClosed()
      .subscribe(() => this.reload());
  }

  async startReview(id: string) {
    await this.openDetails(id);
  }
}