import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { RoleEnum } from '../enums/role.enum';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);

    auth.login('sales', 'password').subscribe();
    httpMock.expectOne('/api/auth/login').flush({
      id: 'u1',
      username: 'sales',
      roles: [RoleEnum.sales],
      token: 't1',
      refreshToken: 'r1',
    });
  });

  it('concurrent 401s trigger one refresh and every request is retried once', () => {
    const results: unknown[] = [];
    http.get('/api/a').subscribe((r) => results.push(r));
    http.get('/api/b').subscribe((r) => results.push(r));

    const unauthorized = { status: 401, statusText: 'Unauthorized' };
    httpMock.expectOne('/api/a').flush({}, unauthorized);
    httpMock.expectOne('/api/b').flush({}, unauthorized);

    httpMock.expectOne('/api/auth/refresh').flush({ token: 't2', refreshToken: 'r2' });

    for (const [url, body] of [
      ['/api/a', 'A'],
      ['/api/b', 'B'],
    ]) {
      const retry = httpMock.expectOne(url);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer t2');
      retry.flush(body);
    }
    expect(results).toEqual(['A', 'B']);
    httpMock.verify();
  });

  it('refresh failure logs out and errors the waiting requests', () => {
    const errors: number[] = [];
    for (const url of ['/api/a', '/api/b']) {
      http.get(url).subscribe({ error: (e) => errors.push(e.status) });
    }
    const unauthorized = { status: 401, statusText: 'Unauthorized' };
    httpMock.expectOne('/api/a').flush({}, unauthorized);
    httpMock.expectOne('/api/b').flush({}, unauthorized);

    httpMock.expectOne('/api/auth/refresh').flush({}, unauthorized);

    expect(errors).toEqual([401, 401]);
    expect(auth.isAuthenticated()).toBe(false);
    httpMock.verify();
  });
});
