import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from '../services/toast.service';
import { handledInline, httpErrorInterceptor } from './http-error.interceptor';

describe('error reporting', () => {
  const toast = { show: vi.fn() };
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    toast.show.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: ToastService, useValue: toast },
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  const fail = (url: string, status: number, context?: ReturnType<typeof handledInline>) => {
    http.get(url, { context }).subscribe({ error: () => undefined });
    httpMock.expectOne(url).flush({}, { status, statusText: 'error' });
  };

  it('shows a toast for server errors, permission errors and lost connections', () => {
    fail('/api/a', 500);
    fail('/api/b', 403);
    fail('/api/c', 0);
    expect(toast.show).toHaveBeenCalledTimes(3);
  });

  it('shows a session-expired toast when a request ends in 401', () => {
    fail('/api/a', 401);
    expect(toast.show).toHaveBeenCalledWith(expect.stringContaining('session has expired'));
  });

  it('stays quiet for validation errors, auth calls and inline-handled requests', () => {
    fail('/api/a', 400);
    fail('/api/auth/login', 401);
    fail('/api/b', 500, handledInline());
    expect(toast.show).not.toHaveBeenCalled();
  });
});
