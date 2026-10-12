import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ReviewQueueComponent } from './review-queue.component';
import { ReviewQueueStore } from '../../stores/review-queue.store';
import { ApplicationsService } from '../../../../core/services/applications.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { a11yProblems } from '../../../../testing/a11y';

const row = (id: string, status: string) => ({
  id,
  status,
  businessName: `Biz ${id}`,
  contactName: `Contact ${id}`,
  monthlyVolume: 6250,
  updatedAt: '2026-01-02T10:00:00.000Z',
});

describe('ReviewQueueComponent', () => {
  let list: ReturnType<typeof vi.fn>;

  const render = async () => {
    TestBed.configureTestingModule({
      imports: [ReviewQueueComponent],
      providers: [
        provideRouter([]),
        { provide: ApplicationsService, useValue: { list } },
        { provide: AuthService, useValue: { can: () => true } },
        { provide: DialogService, useValue: { openSideSheet: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ReviewQueueComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    list = vi.fn().mockReturnValue(
      of({
        items: [row('1', 'submitted'), row('2', 'approved'), row('3', 'submitted')],
        total: 12,
        page: 1,
        pageSize: 10,
      }),
    );
  });

  it('loads the submitted queue on open and renders the rows', async () => {
    const el = await render();
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ status: 'submitted' }));
    expect(el.querySelectorAll('tr[mat-row]').length).toBe(3);
  });

  it('shows the KPI cards from the loaded data', async () => {
    const el = await render();
    const values = Array.from(el.querySelectorAll('.kpi-value')).map((n) => n.textContent?.trim());
    expect(values).toEqual(['2', '1', '0', '12']);
  });

  it('has a status dropdown instead of buttons and changing it reloads', async () => {
    const el = await render();
    expect(el.querySelector('mat-select')).toBeTruthy();
    TestBed.inject(ReviewQueueStore).setStatus('approved');
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'approved', page: 1 }));
  });

  it('formats cells like the other pages', async () => {
    const el = await render();
    expect(el.querySelector('.status-badge')).toBeTruthy();
    expect(el.textContent).toContain('$6,250');
  });

  it('shows an error state with Retry', async () => {
    list.mockReturnValueOnce(throwError(() => new Error('x')));
    const el = await render();
    expect(el.textContent).toContain('Failed to load review queue.');
  });

  it('has no basic accessibility problems', async () => {
    expect(a11yProblems(await render())).toEqual([]);
  });
});
