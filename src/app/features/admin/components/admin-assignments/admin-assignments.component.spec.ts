import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { AdminAssignmentsComponent } from './admin-assignments.component';
import { AdminAssignmentsStore } from '../../stores/admin-assignments.store';
import { ApplicationAssignmentService } from '../../../../core/services/application-assignment.service';
import { ApplicationsService } from '../../../../core/services/applications.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { a11yProblems } from '../../../../testing/a11y';

describe('AdminAssignmentsComponent', () => {
  let assign: ReturnType<typeof vi.fn>;

  const render = async () => {
    assign = vi.fn().mockReturnValue(of({}));
    TestBed.configureTestingModule({
      imports: [AdminAssignmentsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ApplicationsService,
          useValue: {
            list: () =>
              of({
                items: [
                  {
                    id: 'a1',
                    status: 'submitted',
                    businessName: 'Globex 1 LLC',
                    contactName: 'C1',
                    monthlyVolume: 7500,
                    updatedAt: '2026-01-02T10:00:00.000Z',
                    assigneeName: 'reviewer',
                  },
                ],
                total: 1,
                page: 1,
                pageSize: 10,
              }),
          },
        },
        {
          provide: ApplicationAssignmentService,
          useValue: { reviewers: () => of([{ id: 'r1', username: 'reviewer' }]), assign },
        },
        { provide: AuthService, useValue: { can: () => true } },
        { provide: DialogService, useValue: { openSideSheet: vi.fn() } },
        { provide: ToastService, useValue: { show: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(AdminAssignmentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('renders the shared header and a row with its reviewer', async () => {
    const el = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Assignments');
    expect(el.querySelectorAll('tr[mat-row]').length).toBe(1);
    expect(el.textContent).toContain('Globex 1 LLC');
    expect(el.textContent).toContain('reviewer');
  });

  it('loads the reviewer list for the assign menu', async () => {
    await render();
    expect(TestBed.inject(AdminAssignmentsStore).reviewers()).toEqual([
      { id: 'r1', username: 'reviewer' },
    ]);
  });

  it('assignReviewer sends the assignment through the store', async () => {
    await render();
    TestBed.inject(AdminAssignmentsStore).assignReviewer('a1', 'r1');
    expect(assign).toHaveBeenCalledWith('a1', 'r1');
  });

  it('has no basic accessibility problems', async () => {
    expect(a11yProblems(await render())).toEqual([]);
  });
});
