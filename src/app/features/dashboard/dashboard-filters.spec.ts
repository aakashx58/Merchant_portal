/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/interceptors/auth.interceptor';
import { mockBackendInterceptor } from '../../core/mock-backend/mock-backend.interceptor';
import { mockToggles } from '../../core/mock-backend/mock-toggles';
import { DashboardComponent } from './dashboard.component';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Dashboard with mock backend', () => {
  it('search and status filter narrow the results', async () => {
    mockToggles.latencyMs = 5;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
      ],
    });
    await new Promise<void>((res) =>
      TestBed.inject(AuthService)
        .login('admin', 'password')
        .subscribe(() => res()),
    );
    const fixture = TestBed.createComponent(DashboardComponent);
    const cmp = fixture.componentInstance as any;
    fixture.detectChanges();
    await wait(50);
    fixture.detectChanges();
    expect(cmp.applications.value().total).toBe(36);

    cmp.search.setValue('acme');
    await wait(400);
    fixture.detectChanges();
    await wait(50);
    fixture.detectChanges();
    expect(cmp.applications.value().total).toBe(5);

    cmp.search.setValue('');
    await wait(400);
    cmp.setStatus('draft');
    fixture.detectChanges();
    await wait(50);
    fixture.detectChanges();
    expect(cmp.applications.value().total).toBe(9);
  });
});
