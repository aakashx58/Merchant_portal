import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(MatDialog);

  openSideSheet<T, D = unknown, R = unknown>(
    component: ComponentType<T>,
    config?: MatDialogConfig<D>,
  ): MatDialogRef<T, R> {
    const ref = this.dialog.open(component, {
      width: 'clamp(320px, 60vw, 100vw)',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      position: { top: '0', right: '0' },
      panelClass: 'slide-over-panel',
      enterAnimationDuration: '0ms',
      // Only the header cross closes the sheet; a click on the backdrop does not.
      disableClose: true,
      ...config,
    });
    // disableClose also blocks Escape, so keep that keyboard route to close.
    ref.keydownEvents().subscribe((event) => event.key === 'Escape' && ref.close());
    return ref;
  }

  confirm(data: ConfirmDialogData): MatDialogRef<ConfirmDialogComponent, boolean> {
    return this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data,
    });
  }
}
