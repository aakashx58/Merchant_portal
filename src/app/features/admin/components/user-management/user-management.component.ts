import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { UserManagementStore } from '../../stores/user-management.store';

@Component({
  selector: 'app-user-management',
  imports: [
    DatePipe,
    TitleCasePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent {
  protected readonly store = inject(UserManagementStore);

  constructor() {}

  protected setRole(role: string) {
    this.store.setRole(role as any);
  }

  protected onSort(event: any) {
    this.store.onSort({ sort: event.active, dir: event.direction as 'asc' | 'desc' | '' });
  }

  protected onPage(event: any) {
    this.store.onPage({ page: event.pageIndex + 1, pageSize: event.pageSize });
  }

  protected async openDetails(id: string) {
    await this.store.openDetails(id);
  }

  protected toggleRole(userId: string, newRole: string) {
    this.store.toggleRole(userId, newRole);
  }
}