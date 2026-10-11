import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionEnum } from '../../../core/constants/permission.enum';
import { DialogService } from '../../../core/services/dialog.service';
import { ViewportService } from '../../../core/services/viewport.service';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly dialog = inject(DialogService);
  protected readonly permission = PermissionEnum;
  protected readonly isMobile = inject(ViewportService).isMobile;

  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.focusMain());
  }

  protected focusMain(event?: Event) {
    event?.preventDefault();
    this.main().nativeElement.focus();
  }

  protected confirmSignOut() {
    this.dialog
      .confirm({ title: 'Sign out', message: 'Do you want to sign out?', confirmText: 'Sign out' })
      .afterClosed()
      .subscribe((confirmed) => confirmed && this.auth.logout());
  }
}
