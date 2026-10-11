import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { CellDefDirective } from '../../../shared/directives/cell-def.directive';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { DashboardStore } from '../stores/dashboard.store';

@Component({
  selector: 'app-dashboard',
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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly store = inject(DashboardStore);

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
}