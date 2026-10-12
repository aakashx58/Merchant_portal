import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { AdminAssignmentsStore } from './admin-assignments.store';
import { ApplicationsService } from '../../../core/services/applications.service';
import { ApplicationAssignmentService } from '../../../core/services/application-assignment.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';

describe('AdminAssignmentsStore', () => {
  let list: ReturnType<typeof vi.fn>;
  let reviewers: ReturnType<typeof vi.fn>;
  let assign: ReturnType<typeof vi.fn>;
  let toast: { show: ReturnType<typeof vi.fn> };

  const create = () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ApplicationsService, useValue: { list } },
        { provide: ApplicationAssignmentService, useValue: { reviewers, assign } },
        { provide: AuthService, useValue: { can: () => true } },
        { provide: DialogService, useValue: { openSideSheet: vi.fn() } },
        { provide: ToastService, useValue: toast },
      ],
    });
    return TestBed.inject(AdminAssignmentsStore);
  };

  beforeEach(() => {
    list = vi
      .fn()
      .mockReturnValue(of({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }));
    reviewers = vi.fn().mockReturnValue(of([{ id: 'r1', username: 'reviewer' }]));
    assign = vi.fn().mockReturnValue(of({}));
    toast = { show: vi.fn() };
  });

  it('loads applications and reviewers on construction', () => {
    const store = create();
    expect(list).toHaveBeenCalled();
    expect(store.reviewers()).toEqual([{ id: 'r1', username: 'reviewer' }]);
  });

  it('falls back to no reviewers when the reviewer call fails', () => {
    reviewers.mockReturnValue(throwError(() => new Error('x')));
    expect(create().reviewers()).toEqual([]);
  });

  it('sets an error when the list call fails', () => {
    list.mockReturnValue(throwError(() => new Error('down')));
    expect(create().error()).toBe('down');
  });

  it('assignReviewer toasts and reloads on success', () => {
    const store = create();
    list.mockClear();
    store.assignReviewer('a1', 'r1');
    expect(assign).toHaveBeenCalledWith('a1', 'r1');
    expect(toast.show).toHaveBeenCalledWith('Reviewer assigned');
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('assignReviewer toasts a failure and does not reload', () => {
    assign.mockReturnValue(throwError(() => new Error('x')));
    const store = create();
    list.mockClear();
    store.assignReviewer('a1', 'r1');
    expect(toast.show).toHaveBeenCalledWith('Failed to assign reviewer');
    expect(list).not.toHaveBeenCalled();
  });

  it('setStatus resets to page 1', () => {
    const store = create();
    store.onPage({ page: 5, pageSize: 10 });
    store.setStatus('draft');
    expect(store.query()).toMatchObject({ status: 'draft', page: 1 });
  });
});
