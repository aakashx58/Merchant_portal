import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { provideEnvironment } from '../config/environment.token';

// get/post are protected on purpose (only typed domain services call them), so test through a subclass.
@Injectable({ providedIn: 'root' })
class TestApi extends ApiService {
  fetch<T>(endpoint: string, options?: Parameters<ApiService['get']>[1]) {
    return this.get<T>(endpoint, options);
  }
  send<T>(endpoint: string, body: unknown) {
    return this.post<T>(endpoint, body);
  }
}

describe('ApiService', () => {
  let api: TestApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideEnvironment(environment)],
    });
    api = TestBed.inject(TestApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('prefixes endpoints with the environment base url', () => {
    api.fetch('/things').subscribe();
    const req = http.expectOne(`${environment.apiBaseUrl}/things`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('sends POST bodies', () => {
    api.send('/things', { a: 1 }).subscribe();
    const req = http.expectOne(`${environment.apiBaseUrl}/things`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ a: 1 });
    req.flush({});
  });

  it('serialises query params', () => {
    api.fetch('/things', { params: { page: 2, q: 'x' } }).subscribe();
    const req = http.expectOne((r) => r.url === `${environment.apiBaseUrl}/things`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('q')).toBe('x');
    req.flush({});
  });

  it('retries retryable statuses and then succeeds', async () => {
    vi.useFakeTimers();
    let result: unknown;
    api.fetch('/flaky').subscribe((r) => (result = r));
    http
      .expectOne(`${environment.apiBaseUrl}/flaky`)
      .flush('', { status: 503, statusText: 'Unavailable' });
    await vi.advanceTimersByTimeAsync(10_000);
    http.expectOne(`${environment.apiBaseUrl}/flaky`).flush({ ok: true });
    expect(result).toEqual({ ok: true });
  });

  it('does not retry non-retryable statuses', () => {
    let error: unknown;
    api.fetch('/bad').subscribe({ error: (e) => (error = e) });
    http
      .expectOne(`${environment.apiBaseUrl}/bad`)
      .flush('', { status: 400, statusText: 'Bad Request' });
    expect(error).toBeInstanceOf(HttpErrorResponse);
  });
});
