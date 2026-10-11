import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CanActivateFn,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

export function setupGuardTest(auth: { isAuthenticated?: () => boolean; can?: () => boolean }) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
  });
  const router = TestBed.inject(Router);

  return {
    run: (guard: CanActivateFn, url = '/wizard') =>
      runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
        guard({} as never, { url } as RouterStateSnapshot),
      ),
    url: (result: unknown) => router.serializeUrl(result as UrlTree),
  };
}
