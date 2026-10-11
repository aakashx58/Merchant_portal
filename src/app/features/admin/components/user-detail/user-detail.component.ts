import { Component, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { User } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';

interface UserDetailData {
  id: string;
}

@Component({
  selector: 'app-user-detail',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    CommonModule,
    DatePipe,
    TitleCasePipe,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
})
export class UserDetailComponent {
  private readonly data = inject<{ id: string }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<UserDetailComponent>);
  private readonly userService = inject(UserService);

  protected user = signal<User | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  private async load() {
    try {
      const user = await this.userService.getById(this.data.id).toPromise();
      this.user.set(user ?? null);
    } catch (err) {
      this.error.set('Failed to load user details');
    } finally {
      this.loading.set(false);
    }
  }

  protected close() {
    this.dialogRef.close();
  }
}