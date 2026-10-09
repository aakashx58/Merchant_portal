import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { PermissionEnum } from '../enums/permission.enum';

export const permissionGuard =
  (permission: PermissionEnum): CanActivateFn =>
  () =>
    inject(AuthService).can(permission) || inject(Router).createUrlTree(['/']);
