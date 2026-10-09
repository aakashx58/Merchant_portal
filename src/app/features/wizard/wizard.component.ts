import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  map,
  merge,
  of,
  skip,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { ViewportService } from '../../core/services/viewport.service';
import { ToastService } from '../../core/services/toast.service';
import { Application } from '../../core/models/application.model';
import { ApplicationsService, DraftPayload } from '../../core/services/applications.service';
import { ACCOUNT_PATTERN, documentFile, TAX_ID_PATTERN, uniqueTaxId } from './wizard.validators';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

@Component({
  selector: 'app-wizard',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
  ],
  templateUrl: './wizard.component.html',
  styleUrl: './wizard.component.scss',
})
export class WizardComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApplicationsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly stepper = viewChild(MatStepper);
  protected readonly isMobile = inject(ViewportService).isMobile;

  private draftId: string | null = null;
  private version = 0;
  private storedDocumentName = '';
  private lastSaved = '';
  private readonly flush$ = new Subject<void>();

  protected readonly documentTypes = [
    { value: 'business_license', label: 'Business license' },
    { value: 'bank_statement', label: 'Bank statement' },
    { value: 'id_card', label: 'ID card' },
  ];

  protected readonly form = new FormGroup({
    business: new FormGroup({
      businessName: new FormControl('', { nonNullable: true, validators: Validators.required }),
      contactName: new FormControl('', { nonNullable: true, validators: Validators.required }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
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
  });

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly saveStatus = signal<SaveStatus>('idle');
  protected readonly submitting = signal(false);

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    if (this.draftId && this.saveStatus() !== 'saving' && this.isDirty()) {
      this.api
        .saveDraft(this.draftId, this.version, this.payload())
        .subscribe({ error: () => undefined });
    }
  }

  protected load() {
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .latestDraft()
      .pipe(switchMap((draft) => (draft ? of(draft) : this.api.createDraft())))
      .subscribe({
        next: (draft) => {
          this.apply(draft);
          this.loading.set(false);
          this.startAutoSave();
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }

  protected onStepChange() {
    this.flush$.next();
  }

  protected onFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    const control = this.form.controls.documents.controls.document;
    control.setValue(file);
    control.markAsTouched();
    this.form.updateValueAndValidity();
  }

  protected submit() {
    if (!this.draftId) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('Please fix the highlighted fields first.');
      this.focusFirstInvalid();
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

  protected payload(): DraftPayload {
    const { business, financial, documents } = this.form.getRawValue();
    return {
      ...business,
      ...financial,
      documentType: documents.documentType,
      documentName: documents.document?.name ?? this.storedDocumentName,
    };
  }

  private focusFirstInvalid() {
    const { business, financial, documents } = this.form.controls;
    const step = [business, financial, documents].findIndex((group) => group.invalid);
    const stepper = this.stepper();
    if (step >= 0 && stepper) stepper.selectedIndex = step;

    afterNextRender(
      () => {
        const fields = this.host.nativeElement.querySelectorAll<HTMLElement>(
          'input.ng-invalid, mat-select.ng-invalid, input[aria-invalid="true"]',
        );
        Array.from(fields)
          .find((field) => field.offsetParent !== null)
          ?.focus();
      },
      { injector: this.injector },
    );
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
    this.form.updateValueAndValidity({ emitEvent: false });
    this.lastSaved = JSON.stringify(this.payload());
  }

  private startAutoSave() {
    merge(this.form.valueChanges.pipe(debounceTime(1000)), this.flush$)
      .pipe(
        map(() => this.payload()),
        startWith(this.payload()),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        skip(1),
        concatMap((payload) => this.save(payload)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  // Errors are handled inside the inner stream so one failed save never ends auto-save.
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
