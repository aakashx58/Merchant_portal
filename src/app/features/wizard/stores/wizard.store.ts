import { Injectable, signal, computed, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  merge,
  debounceTime,
  filter,
  concatMap,
  map,
  of,
  EMPTY,
  catchError,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { ApplicationDraftService } from '../services/application-draft.service';
import { Application } from '../../../core/models/application.model';
import { DraftPayload } from '../../../core/services/applications.service';
import {
  ACCOUNT_PATTERN,
  documentFile,
  TAX_ID_PATTERN,
  uniqueTaxId,
} from '../validators/wizard.validators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';

export type WizardStep = 0 | 1 | 2 | 3 | 4;
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export interface WizardFormState {
  business: {
    businessName: string;
    contactName: string;
    email: string;
  };
  contacts: {
    additionalContacts: { name: string; role: string; phone: string; email: string }[];
  };
  financial: {
    taxId: string;
    accountNumber: string;
    monthlyVolume: number;
  };
  documents: {
    documentType: string;
    document: File | null;
  };
  review: {
    termsAccepted: boolean;
  };
}

export const initialFormState: WizardFormState = {
  business: { businessName: '', contactName: '', email: '' },
  contacts: { additionalContacts: [] },
  financial: { taxId: '', accountNumber: '', monthlyVolume: 0 },
  documents: { documentType: '', document: null },
  review: { termsAccepted: false },
};

@Injectable({ providedIn: 'root' })
export class WizardStore {
  private readonly api = inject(ApplicationDraftService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly flush$ = new Subject<void>();

  private draftId: string | null = null;
  private version = 0;
  private storedDocumentName = '';
  private lastSaved = '';

  readonly currentStep = signal<WizardStep>(0);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saveStatus = signal<SaveStatus>('idle');
  readonly submitting = signal(false);
  readonly stepsCompleted = signal<Set<WizardStep>>(new Set());

  readonly documentTypes = [
    { value: 'business_license', label: 'Business license' },
    { value: 'bank_statement', label: 'Bank statement' },
    { value: 'id_card', label: 'ID card' },
  ];

  readonly form = new FormGroup({
    business: new FormGroup({
      businessName: new FormControl('', { nonNullable: true, validators: Validators.required }),
      contactName: new FormControl('', { nonNullable: true, validators: Validators.required }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
    }),
    contacts: new FormGroup({
      additionalContacts: new FormArray<
        FormGroup<{
          name: FormControl<string>;
          role: FormControl<string>;
          phone: FormControl<string>;
          email: FormControl<string>;
        }>
      >([]),
    }),
    financial: new FormGroup({
      taxId: new FormControl('', {
        nonNullable: true,
        updateOn: 'blur',
        validators: [Validators.required, Validators.pattern(TAX_ID_PATTERN)],
        asyncValidators: uniqueTaxId(this.api, () => this.draftId),
      }),
      accountNumber: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(ACCOUNT_PATTERN)],
      }),
      monthlyVolume: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
    }),
    documents: new FormGroup({
      documentType: new FormControl('', { nonNullable: true, validators: Validators.required }),
      document: new FormControl<File | null>(null, { validators: documentFile }),
    }),
    review: new FormGroup({
      termsAccepted: new FormControl(false, {
        nonNullable: true,
        validators: Validators.requiredTrue,
      }),
    }),
  });

  private readonly stepGroups = {
    0: this.form.controls.business,
    1: this.form.controls.contacts,
    2: this.form.controls.financial,
    3: this.form.controls.documents,
    4: this.form.controls.review,
  };

  readonly currentStepGroup = computed(() => this.stepGroups[this.currentStep()]);
  // Plain methods, not computed(): form validity is not a signal, so a computed would go stale.
  isStepValid = () => this.currentStepGroup().valid;
  canGoNext = () => this.isStepValid() && this.currentStep() < 4;
  canSubmit = () => this.form.valid;

  constructor() {
    this.startAutoSave();
  }

  load() {
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .latestDraft()
      .pipe(switchMap((draft) => (draft ? of(draft) : this.api.createDraft())))
      .subscribe({
        next: (draft) => {
          this.apply(draft);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }

  nextStep() {
    if (this.canGoNext()) {
      this.stepsCompleted.update((s) => new Set([...s, this.currentStep()]));
      this.currentStep.update((s) => (s + 1) as WizardStep);
    } else {
      this.currentStepGroup().markAllAsTouched();
    }
  }

  previousStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update((s) => (s - 1) as WizardStep);
    }
  }

  goToStep(step: WizardStep) {
    this.currentStep.set(step);
  }

  onStepChange() {
    this.flush$.next();
  }

  onFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    const control = this.form.controls.documents.controls.document;
    control.setValue(file);
    control.markAsTouched();
    this.form.updateValueAndValidity();
  }

  removeFile() {
    const control = this.form.controls.documents.controls.document;
    control.setValue(null);
    control.markAsTouched();
    this.form.updateValueAndValidity();
  }

  addContact(contact: { name: string; role: string; phone: string; email: string }) {
    const contacts = this.form.controls.contacts.controls.additionalContacts;
    contacts.push(
      new FormGroup({
        name: new FormControl(contact.name, { nonNullable: true }),
        role: new FormControl(contact.role, { nonNullable: true }),
        phone: new FormControl(contact.phone, { nonNullable: true }),
        email: new FormControl(contact.email, { nonNullable: true }),
      }),
    );
  }

  removeContact(index: number) {
    const contacts = this.form.controls.contacts.controls.additionalContacts;
    contacts.removeAt(index);
  }

  submit() {
    if (!this.draftId || !this.canSubmit()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast.show('Please fix the highlighted fields first.');
      return;
    }
    this.submitting.set(true);
    const id = this.draftId;
    this.api
      .saveDraft(id, this.version, this.payload())
      .pipe(
        tap((app) => (this.version = app.version)),
        switchMap(() => this.api.submit(id)),
      )
      .subscribe({
        next: () => {
          this.lastSaved = JSON.stringify(this.payload());
          this.toast.show('Application submitted');
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Could not submit the application. Please try again.');
        },
      });
  }

  payload(): DraftPayload {
    const { business, financial, documents } = this.form.getRawValue();
    return {
      ...business,
      ...financial,
      documentType: documents.documentType,
      documentName: documents.document?.name ?? this.storedDocumentName,
    };
  }

  saveOnDestroy() {
    if (this.draftId && this.saveStatus() !== 'saving' && this.isDirty()) {
      this.api
        .saveDraft(this.draftId, this.version, this.payload())
        .subscribe({ error: () => undefined });
    }
  }

  private isDirty() {
    return JSON.stringify(this.payload()) !== this.lastSaved;
  }

  private apply(draft: Application) {
    this.draftId = draft.id;
    this.version = draft.version;
    this.storedDocumentName = draft.documentName;

    this.form.patchValue(
      {
        business: {
          businessName: draft.businessName,
          contactName: draft.contactName,
          email: draft.email,
        },
        financial: {
          taxId: draft.taxId,
          accountNumber: draft.accountNumber,
          monthlyVolume: draft.monthlyVolume,
        },
        documents: { documentType: draft.documentType },
      },
      { emitEvent: false },
    );

    const document = this.form.controls.documents.controls.document;
    document.setValidators(draft.documentName ? documentFile : [documentFile, Validators.required]);
    document.updateValueAndValidity({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
    this.lastSaved = JSON.stringify(this.payload());
  }

  private startAutoSave() {
    merge(this.form.valueChanges.pipe(debounceTime(1000)), this.flush$)
      .pipe(
        filter(() => this.draftId !== null && this.isDirty()),
        map(() => this.payload()),
        concatMap((payload) => this.save(payload)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private save(payload: DraftPayload) {
    this.saveStatus.set('saving');
    return this.api.saveDraft(this.draftId!, this.version, payload).pipe(
      tap((app) => {
        this.version = app.version;
        this.lastSaved = JSON.stringify(payload);
        this.saveStatus.set('saved');
      }),
      catchError(() => {
        this.saveStatus.set('failed');
        return EMPTY;
      }),
    );
  }
}
