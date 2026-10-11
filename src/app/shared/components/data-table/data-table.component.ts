import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, contentChildren, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { CellDefDirective } from '../../directives/cell-def.directive';

export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
}

@Component({
  selector: 'app-data-table',
  imports: [
    NgTemplateOutlet,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSortModule,
    MatTableModule,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T extends object> {
  readonly columns = input.required<TableColumn[]>();
  readonly rows = input<T[]>([]);
  readonly total = input(0);
  readonly page = input(1);
  readonly pageSize = input(10);
  readonly sort = input('');
  readonly sortDir = input<'asc' | 'desc'>('asc');
  readonly loading = input(false);
  readonly error = input(false);
  readonly emptyMessage = input('Nothing to show.');
  readonly errorMessage = input('Could not load data.');

  readonly pageChange = output<{ page: number; pageSize: number }>();
  readonly sortChange = output<{ sort: string; dir: 'asc' | 'desc' | '' }>();
  readonly retry = output<void>();

  private readonly cellDefs = contentChildren(CellDefDirective);

  protected readonly keys = computed(() => this.columns().map((c) => c.key));
  protected readonly templates = computed(
    () => new Map(this.cellDefs().map((d: CellDefDirective) => [d.key(), d.template])),
  );

  protected value(row: T, key: string) {
    const val = (row as Record<string, unknown>)[key];
    return val !== null && val !== undefined && val !== '' ? val : '-';
  }

  protected onPage({ pageIndex, pageSize }: PageEvent) {
    this.pageChange.emit({ page: pageIndex + 1, pageSize });
  }

  protected onSort({ active, direction }: Sort) {
    this.sortChange.emit({ sort: active, dir: direction });
  }
}
