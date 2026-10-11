import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { ReviewQueueStore } from '../../stores';

@Component({
  selector: 'app-review-queue',
  imports: [
    CurrencyPipe,
    DataTableComponent,
    DatePipe,
    TitleCasePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './review-queue.component.html',
  styleUrl: './review-queue.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewQueueComponent {
  protected readonly store = inject(ReviewQueueStore);

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

  protected async startReview(id: string) {
    await this.store.startReview(id);
  }
}