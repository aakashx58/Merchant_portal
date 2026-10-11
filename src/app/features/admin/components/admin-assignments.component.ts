import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { CellDefDirective } from '../../../shared/directives/cell-def.directive';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { AdminAssignmentsStore } from '../stores/admin-assignments.store';

@Component({
  selector: 'app-admin-assignments',
  imports: [
    CellDefDirective,
    CurrencyPipe,
    DataTableComponent,
    DatePipe,
    TitleCasePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-assignments.component.html',
  styleUrl: './admin-assignments.component.scss',
})
export class AdminAssignmentsComponent {
  protected readonly store = inject(AdminAssignmentsStore);

  constructor() {}

  protected setStatus(status: string) {
    this.store.setStatus(status as any);
  }

  protected onSort({ sort, dir }: { sort: string; dir: 'asc' | 'desc' | '' }) {
    this.store.onSort({ sort, dir });
  }

  protected onPage({ page, pageSize }: { page: number; pageSize: number }) {
    this.store.onPage({ page, pageSize });
  }

  protected async openDetails(id: string) {
    await this.store.openDetails(id);
  }

  protected assignReviewer(applicationId: string, reviewerId: string) {
    this.store.assignReviewer(applicationId, reviewerId);
  }
}