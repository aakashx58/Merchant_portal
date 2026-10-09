import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionEnum } from '../../core/enums/permission.enum';
import { ApplicationQuery, ApplicationsService } from '../../core/services/applications.service';
import { CellDefDirective } from '../../shared/data-table/cell-def.directive';
import { DataTableComponent, TableColumn } from '../../shared/data-table/data-table.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CellDefDirective,
    CurrencyPipe,
    DataTableComponent,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly api = inject(ApplicationsService);
  protected readonly auth = inject(AuthService);

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly statuses = ['draft', 'submitted', 'approved', 'rejected'] as const;

  protected readonly query = signal<ApplicationQuery>({
    page: 1,
    pageSize: 10,
    status: '',
    q: '',
    sort: 'updatedAt',
    dir: 'desc',
  });

  protected readonly applications = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.api.list(params),
  });

  protected readonly canReview = computed(() => this.auth.can(PermissionEnum.application_review));
  protected readonly columns = computed<TableColumn[]>(() => [
    { key: 'businessName', header: 'Business', sortable: true },
    { key: 'contactName', header: 'Contact' },
    { key: 'status', header: 'Status' },
    { key: 'monthlyVolume', header: 'Monthly volume', sortable: true },
    { key: 'updatedAt', header: 'Updated', sortable: true },
    ...(this.canReview() ? [{ key: 'actions', header: '' }] : []),
  ]);

  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.patch({ q: q.trim() }));
  }

  protected setStatus(status: ApplicationQuery['status']) {
    this.patch({ status });
  }

  protected onSort({ sort, dir }: { sort: string; dir: 'asc' | 'desc' | '' }) {
    this.patch(dir ? { sort, dir } : { sort: 'updatedAt', dir: 'desc' });
  }

  protected onPage({ page, pageSize }: { page: number; pageSize: number }) {
    this.query.update((q) => ({ ...q, page, pageSize }));
  }

  private patch(change: Partial<ApplicationQuery>) {
    this.query.update((q) => ({ ...q, ...change, page: 1 }));
  }
}
