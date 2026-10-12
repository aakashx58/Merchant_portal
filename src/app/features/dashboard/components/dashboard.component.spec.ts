import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardStore } from '../stores/dashboard.store';
import { ApplicationsService } from '../../../core/services/applications.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { PermissionEnum } from '../../../core/constants/permission.enum';
import { a11yProblems } from '../../../testing/a11y';

const row = (id: string, status: string, name: string) => ({
  id,
  status,
  businessName: name,
  contactName: `Contact ${id}`,
  monthlyVolume: 5000,
  updatedAt: '2026-01-02T10:00:00.000Z',
  assigneeName: null,
});

describe('DashboardComponent', () => {
  let list: ReturnType<typeof vi.fn>;
  let counts: ReturnType<typeof vi.fn>;
  let perms: Set<PermissionEnum>;
  let fixture: ComponentFixture<DashboardComponent>;

  const render = async () => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ApplicationsService, useValue: { list, counts } },
        { provide: AuthService, useValue: { can: (p: PermissionEnum) => perms.has(p) } },
        { provide: DialogService, useValue: { openSideSheet: vi.fn() } },
      ],
    });
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    perms = new Set();
    counts = vi
      .fn()
      .mockReturnValue(of({ draft: 1, submitted: 2, approved: 3, rejected: 4, total: 10 }));
    list = vi.fn().mockReturnValue(
      of({
        items: [row('1', 'draft', 'Acme 1 LLC'), row('2', 'submitted', 'Globex 1 LLC')],
        total: 2,
        page: 1,
        pageSize: 10,
      }),
    );
  });

  it('renders the page header and one table row per application', async () => {
    const el = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Applications');
    expect(el.querySelectorAll('tr[mat-row]').length).toBe(2);
    expect(el.textContent).toContain('Acme 1 LLC');
  });

  it('formats cells: status badge and currency', async () => {
    const el = await render();
    expect(el.querySelector('.status-badge.status-submitted')?.textContent?.trim()).toBe(
      'Submitted',
    );
    expect(el.textContent).toContain('$5,000');
  });

  it('does not show the New Application button (it lives in the sidebar)', async () => {
    perms.add(PermissionEnum.application_create);
    const el = await render();
    expect(el.textContent).not.toContain('New Application');
  });

  it('shows an error with Retry that reloads', async () => {
    list.mockReturnValueOnce(throwError(() => new Error('down')));
    const el = await render();
    const retry = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Retry'),
    );
    expect(retry).toBeTruthy();
    retry!.click();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('shows an empty message when nothing matches', async () => {
    list.mockReturnValue(of({ items: [], total: 0, page: 1, pageSize: 10 }));
    const el = await render();
    expect(el.textContent).toContain('No applications found.');
  });

  describe('status counts', () => {
    it('are hidden when they could not be loaded', async () => {
      counts.mockReturnValue(throwError(() => new Error('x')));
      const el = await render();
      expect(el.querySelector('.stat-grid')).toBeNull();
    });

    it('show one card per status plus total, and are display-only (not filters)', async () => {
      const el = await render();
      expect(el.querySelectorAll('.stat-card').length).toBe(5);
      expect(el.querySelectorAll('button.stat-card').length).toBe(0);
      const values = Array.from(el.querySelectorAll('.stat-value')).map((n) =>
        n.textContent?.trim(),
      );
      expect(values).toEqual(['1', '2', '3', '4', '10']);
      list.mockClear();
      el.querySelector<HTMLElement>('.stat-card')!.click();
      expect(list).not.toHaveBeenCalled();
      expect(TestBed.inject(DashboardStore).query().status).toBe('');
    });
  });

  it('typing in search filters after the debounce', async () => {
    const el = await render();
    vi.useFakeTimers();
    const input = el.querySelector<HTMLInputElement>('.search-box input')!;
    input.value = 'acme';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'acme', page: 1 }));
  });

  it('has no basic accessibility problems', async () => {
    expect(a11yProblems(await render())).toEqual([]);
  });
});
