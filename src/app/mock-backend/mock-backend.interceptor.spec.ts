import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../core/services/auth.service';
import { authInterceptor } from '../core/interceptors/auth.interceptor';
import { Application, Page } from '../core/models/application.model';
import { environment } from '../../environments/environment';
import { provideEnvironment } from '../core/config/environment.token';
import { mockBackendInterceptor } from './mock-backend.interceptor';
import { mockToggles } from './mock-toggles';

const DECISION = { decision: 'approved', riskLevel: 'high', note: 'fine' };

describe('mock backend rules', () => {
  let http: HttpClient;
  let auth: AuthService;

  const loginAs = (username: string) => firstValueFrom(auth.login(username, 'password'));
  const status = (request: Promise<unknown>) =>
    request.then(
      () => 200,
      (err) => err.status as number,
    );

  beforeEach(() => {
    mockToggles.latencyMs = 1;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
        provideEnvironment(environment),
      ],
    });
    http = TestBed.inject(HttpClient);
    auth = TestBed.inject(AuthService);
  });

  it('returns masked values and only reveals them to roles that may', async () => {
    await loginAs('reviewer');
    const app = await firstValueFrom(http.get<Application>('/api/applications/app-2'));
    expect(app.taxId).toMatch(/^\*{3}-\*{2}-\d{4}$/);

    const revealed = await firstValueFrom(
      http.post<{ value: string }>('/api/applications/app-2/reveal', { field: 'taxId' }),
    );
    expect(revealed.value).toMatch(/^\d{3}-\d{2}-\d{4}$/);

    await loginAs('sales');
    const denied = http.post('/api/applications/app-2/reveal', { field: 'taxId' });
    expect(await status(firstValueFrom(denied))).toBe(403);
  });

  it('lets a reviewer see only the applications assigned to them', async () => {
    await loginAs('reviewer');
    const page = await firstValueFrom(
      http.get<Page<Application>>('/api/applications', { params: { pageSize: 100 } }),
    );
    expect(page.total).toBeGreaterThan(0);
    expect(page.items.every((a: Application) => a.assigneeId === 'u-reviewer')).toBe(true);

    const other = http.get('/api/applications/app-6');
    expect(await status(firstValueFrom(other))).toBe(403);

    const decision = http.post('/api/applications/app-6/decision', DECISION);
    expect(await status(firstValueFrom(decision))).toBe(403);
  });

  it('refuses a review decision from a role without the review permission', async () => {
    await loginAs('sales');
    const decision = http.post('/api/applications/app-2/decision', DECISION);
    expect(await status(firstValueFrom(decision))).toBe(403);
  });

  it('applies a decision once, records it in the history, and ignores a repeat', async () => {
    await loginAs('reviewer');
    const decide = (key: string, decision = 'approved') =>
      firstValueFrom(
        http.post<Application>(
          '/api/applications/app-10/decision',
          { ...DECISION, decision },
          { headers: { 'Idempotency-Key': key } },
        ),
      );

    const first = await decide('k1');
    const second = await decide('k1');
    expect(second.version).toBe(first.version);
    expect(first.history.at(-1)).toMatchObject({ action: 'approved', riskLevel: 'high' });

    expect(await status(decide('k2', 'rejected'))).toBe(409);
  });

  it('requires a note and a risk level for a decision', async () => {
    await loginAs('reviewer');
    const post = (body: object) =>
      status(firstValueFrom(http.post('/api/applications/app-18/decision', body)));

    expect(await post({ ...DECISION, note: '  ' })).toBe(400);
    expect(await post({ decision: 'approved', note: 'ok' })).toBe(400);
  });

  it('lets only an admin assign a reviewer, and records it', async () => {
    const assign = (assigneeId: string) =>
      firstValueFrom(http.put<Application>('/api/applications/app-14/assignment', { assigneeId }));

    await loginAs('sales');
    expect(await status(assign('u-reviewer'))).toBe(403);
    await loginAs('reviewer');
    expect(await status(assign('u-reviewer'))).toBe(403);

    await loginAs('admin');
    expect(await status(assign('u-sales'))).toBe(400);
    const updated = await assign('u-reviewer');
    expect(updated.assigneeId).toBe('u-reviewer');
    expect(updated.history.at(-1)?.action).toBe('assigned');
  });

  it('only checks tax IDs against applications the caller can see', async () => {
    const check = () =>
      firstValueFrom(
        http.get<{ available: boolean }>('/api/applications/check-tax-id', {
          params: { value: '101-11-1007', exclude: '' },
        }),
      );

    await loginAs('sales');
    expect((await check()).available).toBe(false);
    await loginAs('sales2');
    expect((await check()).available).toBe(true);
  });
});
