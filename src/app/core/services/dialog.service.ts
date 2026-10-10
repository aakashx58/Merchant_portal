import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(MatDialog);

  openSideSheet<T, D = any, R = any>(
    component: ComponentType<T>,
    config?: MatDialogConfig<D>
  ): MatDialogRef<T, R> {
    return this.dialog.open(component, {
      width: 'clamp(320px, 60vw, 100vw)',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      position: { top: '0', right: '0' },
      panelClass: 'slide-over-panel',
      enterAnimationDuration: '0ms',
      ...config,
    });
  }

  confirm(data: ConfirmDialogData): MatDialogRef<ConfirmDialogComponent, boolean> {
    return this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data,
    });
  }
}

