import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { WizardStore } from './wizard.store';
import { ApplicationDraftService } from '../services/application-draft.service';
import { ToastService } from '../../../core/services/toast.service';

const draft = (over: object = {}) =>
  ({
    id: 'd1',
    version: 1,
    businessName: 'Acme',
    contactName: 'Jane',
    email: 'jane@acme.com',
    taxId: '123-45-6789',
    accountNumber: '12345678',
    monthlyVolume: 5000,
    documentType: 'bank_statement',
    documentName: 'stmt.pdf',
    ...over,
  }) as never;

describe('WizardStore', () => {
  let store: WizardStore;
  let api: Record<
    'latestDraft' | 'createDraft' | 'saveDraft' | 'submit' | 'taxIdAvailable',
    ReturnType<typeof vi.fn>
  >;
  let toast: { show: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = {
      latestDraft: vi.fn().mockReturnValue(of(draft())),
      createDraft: vi.fn().mockReturnValue(of(draft({ id: 'new' }))),
      saveDraft: vi.fn().mockReturnValue(of(draft({ version: 2 }))),
      submit: vi.fn().mockReturnValue(of(draft())),
      taxIdAvailable: vi.fn().mockReturnValue(of({ available: true })),
    };
    toast = { show: vi.fn() };
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: ApplicationDraftService, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
      ],
    });
    store = TestBed.inject(WizardStore);
  });

  describe('load', () => {
    it('applies the latest draft to the form', () => {
      store.load();
      expect(store.loading()).toBe(false);
      expect(store.form.controls.business.value).toMatchObject({
        businessName: 'Acme',
        email: 'jane@acme.com',
      });
      expect(store.form.controls.financial.controls.monthlyVolume.value).toBe(5000);
      expect(api.createDraft).not.toHaveBeenCalled();
    });

    it('creates a draft when none exists', () => {
      api.latestDraft.mockReturnValue(of(null));
      store.load();
      expect(api.createDraft).toHaveBeenCalled();
      expect(store.loadError()).toBe(false);
    });

    it('flags loadError on failure', () => {
      api.latestDraft.mockReturnValue(throwError(() => new Error('x')));
      store.load();
      expect(store.loading()).toBe(false);
      expect(store.loadError()).toBe(true);
    });

    it('does not require a new upload when a document is already stored', () => {
      store.load();
      expect(store.form.controls.documents.controls.document.valid).toBe(true);
    });

    it('requires an upload when the draft has no stored document', () => {
      api.latestDraft.mockReturnValue(of(draft({ documentName: '' })));
      store.load();
      expect(store.form.controls.documents.controls.document.hasError('required')).toBe(true);
    });
  });

  describe('navigation', () => {
    it('starts at step 0', () => {
      expect(store.currentStep()).toBe(0);
    });

    it('does not advance past an invalid step and marks it touched', () => {
      store.nextStep();
      expect(store.currentStep()).toBe(0);
      expect(store.form.controls.business.controls.businessName.touched).toBe(true);
    });

    it('advances from a valid step and records it as completed', () => {
      store.load();
      store.nextStep();
      expect(store.currentStep()).toBe(1);
      expect(store.stepsCompleted().has(0)).toBe(true);
    });

    it('previousStep stops at 0', () => {
      store.previousStep();
      expect(store.currentStep()).toBe(0);
      store.goToStep(2);
      store.previousStep();
      expect(store.currentStep()).toBe(1);
    });

    it('cannot go next from the last step', () => {
      store.goToStep(4);
      expect(store.canGoNext()).toBe(false);
    });
  });

  describe('contacts', () => {
    it('adds and removes additional contacts', () => {
      const list = store.form.controls.contacts.controls.additionalContacts;
      store.addContact({ name: 'A', role: 'CFO', phone: '1', email: 'a@x.com' });
      store.addContact({ name: 'B', role: 'CTO', phone: '2', email: 'b@x.com' });
      expect(list.length).toBe(2);
      store.removeContact(0);
      expect(list.at(0).controls.name.value).toBe('B');
    });
  });

  describe('files', () => {
    it('onFile sets the document and removeFile clears it', () => {
      const f = { name: 'a.pdf', type: 'application/pdf', size: 10 } as File;
      store.onFile({ target: { files: [f] } } as unknown as Event);
      expect(store.form.controls.documents.controls.document.value).toBe(f);
      store.removeFile();
      expect(store.form.controls.documents.controls.document.value).toBeNull();
    });

    it('flags an unsupported file type', () => {
      const f = { name: 'a.exe', type: 'application/x-msdownload', size: 10 } as File;
      store.onFile({ target: { files: [f] } } as unknown as Event);
      expect(store.form.controls.documents.controls.document.hasError('fileType')).toBe(true);
    });
  });

  describe('payload', () => {
    it('merges form values and falls back to the stored document name', () => {
      store.load();
      expect(store.payload()).toMatchObject({
        businessName: 'Acme',
        taxId: '123-45-6789',
        documentType: 'bank_statement',
        documentName: 'stmt.pdf',
      });
    });
  });

  describe('submit', () => {
    const makeValid = () => {
      vi.useFakeTimers();
      store.load();
      store.form.controls.review.controls.termsAccepted.setValue(true);
      vi.advanceTimersByTime(300); // let the async tax-id check settle
      vi.useRealTimers();
    };

    it('does nothing before a draft is loaded', () => {
      store.submit();
      expect(api.submit).not.toHaveBeenCalled();
    });

    it('does nothing when the form is invalid', () => {
      store.load();
      store.submit();
      expect(api.submit).not.toHaveBeenCalled();
    });

    it('saves with the current version, submits, toasts and navigates', () => {
      makeValid();
      store.submit();
      expect(api.saveDraft).toHaveBeenCalledWith('d1', 1, expect.any(Object));
      expect(api.submit).toHaveBeenCalledWith('d1');
      expect(toast.show).toHaveBeenCalledWith('Application submitted');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('re-enables the form and toasts when submit fails', () => {
      api.submit.mockReturnValue(throwError(() => new Error('x')));
      makeValid();
      store.submit();
      expect(store.submitting()).toBe(false);
      expect(toast.show).toHaveBeenCalledWith(
        'Could not submit the application. Please try again.',
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('auto-save', () => {
    beforeEach(() => {
      store.load();
    });

    it('debounces typing: saves once, 1 s after the last change, not before', () => {
      vi.useFakeTimers();
      const name = store.form.controls.business.controls.businessName;
      name.setValue('A');
      vi.advanceTimersByTime(600);
      name.setValue('AB'); // restarts the timer
      vi.advanceTimersByTime(999);
      expect(api.saveDraft).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(api.saveDraft).toHaveBeenCalledTimes(1);
      expect(api.saveDraft).toHaveBeenCalledWith(
        'd1',
        1,
        expect.objectContaining({ businessName: 'AB' }),
      );
      vi.useRealTimers();
    });

    it('saves on flush when the payload changed', () => {
      store.form.controls.business.controls.businessName.setValue('Changed', { emitEvent: false });
      store.onStepChange();
      expect(api.saveDraft).toHaveBeenCalledWith(
        'd1',
        1,
        expect.objectContaining({ businessName: 'Changed' }),
      );
      expect(store.saveStatus()).toBe('saved');
    });

    it('does not save when nothing changed', () => {
      store.onStepChange();
      expect(api.saveDraft).not.toHaveBeenCalled();
    });

    it('reports failed saves', () => {
      api.saveDraft.mockReturnValue(throwError(() => new Error('x')));
      store.form.controls.business.controls.businessName.setValue('Changed', { emitEvent: false });
      store.onStepChange();
      expect(store.saveStatus()).toBe('failed');
    });

    it('saveOnDestroy only saves a dirty draft', () => {
      store.saveOnDestroy();
      expect(api.saveDraft).not.toHaveBeenCalled();
      store.form.controls.business.controls.businessName.setValue('Changed', { emitEvent: false });
      store.saveOnDestroy();
      expect(api.saveDraft).toHaveBeenCalledTimes(1);
    });
  });
});
