import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { describe, expect, it, vi } from 'vitest';
import { PermissionEnum } from '../../../../core/constants/permission.enum';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
import { provideEnvironment } from '../../../../core/config/environment.token';
import { ApplicationDetailComponent } from './application-detail.component';

const submitted = {
  id: 'app-1',
  businessName: 'Acme 1 LLC',
  status: 'submitted',
  history: [],
  monthlyVolume: 5000,
  taxId: '***-**-1000',
  accountNumber: '****0000',
};

/** Opens the detail panel as a user holding only `granted` permissions. */
async function open(granted: PermissionEnum[], application: object = submitted) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideEnvironment(environment),
      { provide: MAT_DIALOG_DATA, useValue: { id: 'app-1' } },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
      {
        provide: AuthService,
        useValue: { can: (p: PermissionEnum) => granted.includes(p), user: () => ({ id: 'u1' }) },
      },
    ],
  });
  const fixture = TestBed.createComponent(ApplicationDetailComponent);
  fixture.detectChanges();
  TestBed.inject(HttpTestingController)
    .expectOne(`${environment.apiBaseUrl}/applications/app-1`)
    .flush(application);
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('role-based controls', () => {
  it('SALES (no review or assign permission) sees no review or assignment controls', async () => {
    const el = await open([PermissionEnum.application_create, PermissionEnum.application_view_own]);
    expect(el.textContent).toContain('Acme 1 LLC');
    expect(el.querySelector('app-review-panel')).toBeNull();
    expect(el.querySelector('app-assignment-panel')).toBeNull();
  });

  it('REVIEWER sees the review panel on a submitted application', async () => {
    const el = await open([PermissionEnum.application_review]);
    expect(el.querySelector('app-review-panel')).toBeTruthy();
    expect(el.querySelector('app-assignment-panel')).toBeNull();
  });

  it('REVIEWER does not see the review panel once the application is decided', async () => {
    const el = await open([PermissionEnum.application_review], {
      ...submitted,
      status: 'approved',
    });
    expect(el.querySelector('app-review-panel')).toBeNull();
  });

  it('ADMIN sees the assignment panel but cannot review', async () => {
    const el = await open([PermissionEnum.application_assign]);
    expect(el.querySelector('app-assignment-panel')).toBeTruthy();
    expect(el.querySelector('app-review-panel')).toBeNull();
  });

  it('only users with the reveal permission get a Reveal button', async () => {
    const without = await open([]);
    expect(without.textContent).not.toContain('Reveal');
    TestBed.resetTestingModule();
    const withPerm = await open([PermissionEnum.sensitive_reveal]);
    expect(withPerm.textContent).toContain('Reveal');
  });

  it('shows the masked values, never the real ones', async () => {
    const el = await open([]);
    expect(el.textContent).toContain('***-**-1000');
    expect(el.textContent).toContain('****0000');
  });
});

describe('ApplicationDetailComponent', () => {
  it('loads the application by id and renders it', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideEnvironment(environment),
        { provide: MAT_DIALOG_DATA, useValue: { id: 'app-1' } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: AuthService, useValue: { can: () => false, user: () => ({ id: 'u1' }) } },
      ],
    });
    const fixture = TestBed.createComponent(ApplicationDetailComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiBaseUrl}/applications/app-1`)
      .flush({
        id: 'app-1',
        businessName: 'Acme 1 LLC',
        status: 'draft',
        history: [],
        monthlyVolume: 5000,
      });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Acme 1 LLC');
  });
});
