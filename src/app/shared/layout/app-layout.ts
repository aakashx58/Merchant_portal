import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionEnum } from '../../core/enums/permission.enum';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayout {
  protected readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  protected readonly permission = PermissionEnum;

  protected confirmSignOut() {
    this.dialog
      .open(ConfirmDialog, {
        data: { title: 'Sign out', message: 'Do you want to sign out?', confirmText: 'Sign out' },
      })
      .afterClosed()
      .subscribe((confirmed) => confirmed && this.auth.logout());
  }
}
