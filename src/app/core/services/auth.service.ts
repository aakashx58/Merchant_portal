import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, shareReplay, tap, throwError } from 'rxjs';
import { PermissionEnum } from '../constants/permission.enum';
import { User } from '../models/user.model';
import { hasPermission } from '../utils/permission.utils';

const SESSION_KEY = 'session';

interface Tokens {
  token: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<User | null>(
    JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null'),
  );
  private inflightRefresh: Observable<string> | null = null;

  readonly user = this.session.asReadonly();
  readonly roles = computed(() => this.session()?.roles ?? []);
  readonly isAuthenticated = computed(() => this.session() !== null);

  token(): string | null {
    return this.session()?.token ?? null;
  }

  can(permission: PermissionEnum): boolean {
    return hasPermission(this.roles(), permission);
  }

  login(username: string, password: string): Observable<User> {
    return this.http
      .post<User>('/api/auth/login', { username, password })
      .pipe(tap((user) => this.setSession(user)));
  }

  refresh(): Observable<string> {
    return (this.inflightRefresh ??= this.http
      .post<Tokens>('/api/auth/refresh', { refreshToken: this.session()?.refreshToken })
      .pipe(
        tap((t) => this.setSession({ ...this.session()!, ...t })),
        map((t) => t.token),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        }),
        finalize(() => (this.inflightRefresh = null)),
        shareReplay(1),
      ));
  }

  logout(): void {
    this.setSession(null);
    this.router.navigate(['/login']);
  }

  private setSession(user: User | null) {
    this.session.set(user);
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEY);
  }
}
