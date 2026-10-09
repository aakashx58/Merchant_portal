import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { map } from 'rxjs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionEnum } from '../../core/enums/permission.enum';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  protected readonly permission = PermissionEnum;
  protected readonly isMobile = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 800px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected confirmSignOut() {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Sign out', message: 'Do you want to sign out?', confirmText: 'Sign out' },
      })
      .afterClosed()
      .subscribe((confirmed) => confirmed && this.auth.logout());
  }
}
