import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionEnum } from '../constants/permission.enum';

export const permissionGuard =
  (permission: PermissionEnum): CanActivateFn =>
  () =>
    inject(AuthService).can(permission) || inject(Router).createUrlTree(['/']);
