/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Application } from '../../core/models/application.model';
import { WizardComponent } from './wizard.component';

const draft: Application = {
  id: 'app-1',
  ownerId: 'u-sales',
  status: 'draft',
  version: 1,
  businessName: 'Acme',
  contactName: 'Jo',
  email: 'jo@example.com',
  taxId: '***-**-1000',
  accountNumber: '****1234',
  monthlyVolume: 1000,
  documentType: 'business_license',
  documentName: 'license.pdf',
  createdAt: '',
  updatedAt: '',
};

describe('Wizard auto-save', () => {
  let httpMock: HttpTestingController;
  let cmp: any;
  let version: number;

  const edit = (name: string) => {
    cmp.form.controls.business.controls.businessName.setValue(name);
    vi.advanceTimersByTime(1000);
  };
  const putRequests = () => httpMock.match((r) => r.method === 'PUT');

  beforeEach(() => {
    vi.useFakeTimers();
    version = 1;
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(WizardComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
    httpMock.expectOne((r) => r.method === 'GET').flush({ items: [draft], total: 1 });
  });

  afterEach(() => vi.useRealTimers());

  it('debounces rapid edits into one save and sends the draft version', () => {
    cmp.form.controls.business.controls.businessName.setValue('A');
    vi.advanceTimersByTime(500);
    edit('AB');

    const [put, ...rest] = putRequests();
    expect(rest).toHaveLength(0);
    expect(put.request.body.businessName).toBe('AB');
    expect(put.request.headers.get('If-Match')).toBe('"1"');
    put.flush({ ...draft, version: ++version });
  });

  it('does not save again when the value has not changed', () => {
    edit('Same');
    putRequests()[0].flush({ ...draft, version: ++version });

    edit('Same');
    expect(putRequests()).toHaveLength(0);
  });

  it('keeps auto-saving after a failed save', () => {
    edit('First');
    putRequests()[0].flush({}, { status: 500, statusText: 'Server Error' });
    expect(cmp.saveStatus()).toBe('failed');

    edit('Second');
    const [retry] = putRequests();
    expect(retry.request.body.businessName).toBe('Second');
    retry.flush({ ...draft, version: ++version });
    expect(cmp.saveStatus()).toBe('saved');
  });
});
