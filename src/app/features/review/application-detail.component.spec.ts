import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionEnum } from '../../core/enums/permission.enum';
import { Application } from '../../core/models/application.model';
import { ApplicationDetailComponent } from './application-detail.component';

const application: Application = {
  id: 'app-2',
  ownerId: 'u-sales',
  status: 'submitted',
  version: 1,
  businessName: 'Globex 1 LLC',
  contactName: 'Contact 2',
  email: 'contact2@example.com',
  taxId: '***-**-1007',
  accountNumber: '****2345',
  monthlyVolume: 6250,
  documentType: 'business_license',
  documentName: 'license.pdf',
  assigneeId: 'u-reviewer',
  assigneeName: 'reviewer',
  history: [
    { at: '2026-10-01T10:00:00Z', actorId: 'u-sales', actorName: 'sales', action: 'created' },
    { at: '2026-10-02T10:00:00Z', actorId: 'u-sales', actorName: 'sales', action: 'submitted' },
  ],
  createdAt: '',
  updatedAt: '2026-10-02T10:00:00Z',
};

async function open(userId: string, permissions: PermissionEnum[]) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MAT_DIALOG_DATA, useValue: { id: 'app-2' } },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
      {
        provide: AuthService,
        useValue: {
          user: () => ({ id: userId }),
          can: (p: PermissionEnum) => permissions.includes(p),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(ApplicationDetailComponent);
  fixture.detectChanges();
  const httpMock = TestBed.inject(HttpTestingController);
  httpMock.expectOne('/api/applications/app-2').flush(application);
  await fixture.whenStable();
  fixture.detectChanges();
  if (permissions.includes(PermissionEnum.application_assign)) {
    httpMock
      .expectOne((r) => r.url === '/api/users')
      .flush([{ id: 'u-reviewer', username: 'reviewer' }]);
    await fixture.whenStable();
    fixture.detectChanges();
  }
  return fixture.nativeElement as HTMLElement;
}

describe('ApplicationDetailComponent', () => {
  it('shows the review panel to the assigned reviewer, plus the history newest first', async () => {
    const el = await open('u-reviewer', [
      PermissionEnum.application_review,
      PermissionEnum.sensitive_reveal,
    ]);
    expect(el.querySelector('app-review-panel')).not.toBeNull();
    expect(el.querySelector('app-assignment-panel')).toBeNull();

    const entries = Array.from(el.querySelectorAll('.history li')).map((li) => li.textContent);
    expect(entries[0]).toContain('submitted');
    expect(entries[1]).toContain('created');
  });

  it('tells another reviewer the application is assigned elsewhere', async () => {
    const el = await open('u-reviewer2', [PermissionEnum.application_review]);
    expect(el.querySelector('app-review-panel')).toBeNull();
    expect(el.textContent).toContain('assigned to another reviewer');
  });

  it('lets an admin assign a reviewer but not decide', async () => {
    const el = await open('u-admin', [
      PermissionEnum.application_assign,
      PermissionEnum.sensitive_reveal,
    ]);
    expect(el.querySelector('app-assignment-panel')).not.toBeNull();
    expect(el.querySelector('app-review-panel')).toBeNull();
  });

  it('shows sales neither panel and no reveal buttons', async () => {
    const el = await open('u-sales', [PermissionEnum.application_view_own]);
    expect(el.querySelector('app-review-panel')).toBeNull();
    expect(el.querySelector('app-assignment-panel')).toBeNull();
    expect(el.textContent).not.toContain('Reveal');
  });
});
