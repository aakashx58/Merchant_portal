import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { WizardComponent } from './wizard.component';
import { WizardStore } from '../stores/wizard.store';
import { ApplicationDraftService } from '../services/application-draft.service';
import { ToastService } from '../../../core/services/toast.service';
import { a11yProblems } from '../../../testing/a11y';

const draft = {
  id: 'd1',
  version: 1,
  businessName: '',
  contactName: '',
  email: '',
  taxId: '',
  accountNumber: '',
  monthlyVolume: 0,
  documentType: '',
  documentName: '',
};

describe('WizardComponent', () => {
  let api: Record<
    'latestDraft' | 'createDraft' | 'saveDraft' | 'submit' | 'taxIdAvailable',
    ReturnType<typeof vi.fn>
  >;

  const render = async () => {
    TestBed.configureTestingModule({
      imports: [WizardComponent],
      providers: [
        { provide: ApplicationDraftService, useValue: api },
        { provide: ToastService, useValue: { show: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(WizardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    api = {
      latestDraft: vi.fn().mockReturnValue(of(draft)),
      createDraft: vi.fn().mockReturnValue(of(draft)),
      saveDraft: vi.fn().mockReturnValue(of(draft)),
      submit: vi.fn().mockReturnValue(of(draft)),
      taxIdAvailable: vi.fn().mockReturnValue(of({ available: true })),
    };
  });

  it('loads the latest draft when opened', async () => {
    await render();
    expect(api.latestDraft).toHaveBeenCalled();
  });

  it('shows the page header and the five step labels', async () => {
    const el = await render();
    expect(el.querySelector('h1')?.textContent).toContain('New application');
    const labels = Array.from(el.querySelectorAll('.mat-step-label')).map((l) =>
      l.textContent?.trim(),
    );
    expect(labels).toEqual(['Business', 'Contacts', 'Financial', 'Documents', 'Review']);
  });

  it('no longer renders the bottom progress bar', async () => {
    const el = await render();
    expect(el.querySelector('.progress-bar-container')).toBeNull();
  });

  it('starts on the business step with its required fields marked', async () => {
    const el = await render();
    expect(el.querySelector('#businessName')).toBeTruthy();
    expect(el.querySelectorAll('label.required').length).toBeGreaterThanOrEqual(3);
  });

  it('renders a single Submit button, in the wizard footer', async () => {
    const el = await render();
    const submits = Array.from(el.querySelectorAll('button')).filter((b) =>
      b.textContent?.includes('Submit Application'),
    );
    expect(submits.length).toBe(1);
  });

  it('shows a retry when the draft cannot be loaded, and retry loads again', async () => {
    api.latestDraft.mockReturnValueOnce(throwError(() => new Error('x')));
    const el = await render();
    expect(el.textContent).toContain('Failed to load application');
    Array.from(el.querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Retry'))!
      .click();
    expect(api.latestDraft).toHaveBeenCalledTimes(2);
  });

  it('has no basic accessibility problems', async () => {
    expect(a11yProblems(await render())).toEqual([]);
  });

  it('saves a dirty draft when the page is left', async () => {
    await render();
    TestBed.inject(WizardStore).form.controls.business.controls.businessName.setValue('Changed', {
      emitEvent: false,
    });
    expect(api.saveDraft).not.toHaveBeenCalled();
    TestBed.resetTestingModule(); // destroys the component, which runs ngOnDestroy
    expect(api.saveDraft).toHaveBeenCalledWith(
      'd1',
      1,
      expect.objectContaining({ businessName: 'Changed' }),
    );
  });
});
