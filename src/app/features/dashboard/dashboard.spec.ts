import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from './dashboard';

const emptyPage = { items: [], total: 0, page: 1, pageSize: 10 };

describe('Dashboard', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => vi.useRealTimers());

  it('debounces search and goes back to page 1', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    httpMock.expectOne((r) => r.params.get('page') === '1').flush(emptyPage);

    const cmp = fixture.componentInstance as any;
    cmp.onPage({ page: 3, pageSize: 10 });
    fixture.detectChanges();
    httpMock.expectOne((r) => r.params.get('page') === '3').flush(emptyPage);

    cmp.search.setValue('a');
    cmp.search.setValue('acme');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.params.get('q') === 'acme');
    expect(req.request.params.get('page')).toBe('1');
    httpMock.verify();
  });
});
