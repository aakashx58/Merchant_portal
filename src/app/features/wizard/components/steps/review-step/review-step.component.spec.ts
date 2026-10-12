import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReviewStepComponent } from './review-step.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ReviewStepComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ReviewStepComponent>>;

  const createFormGroup = (fb: FormBuilder): FormGroup => {
    const businessGroup = fb.group({
      businessName: ['Test Business', Validators.required],
      contactName: ['John Doe', Validators.required],
      email: ['john@test.com', [Validators.required, Validators.email]],
    });

    const contactsGroup = fb.group({
      additionalContacts: fb.array([
        fb.group({ name: 'Jane', role: 'Manager', phone: '555-1234', email: 'jane@test.com' }),
      ]),
    });

    const financialGroup = fb.group({
      taxId: ['123-45-6789', [Validators.required, Validators.pattern(/^\d{3}-\d{2}-\d{4}$/)]],
      accountNumber: ['12345678', [Validators.required, Validators.pattern(/^\d{8,17}$/)]],
      monthlyVolume: [50000, [Validators.required, Validators.min(1)]],
    });

    const documentsGroup = fb.group({
      documentType: ['business_license', Validators.required],
      document: [new File(['test'], 'test.pdf', { type: 'application/pdf' }), Validators.required],
    });

    const reviewGroup = fb.group({
      termsAccepted: [false, Validators.requiredTrue],
    });

    return fb.group({
      business: businessGroup,
      contacts: contactsGroup,
      financial: financialGroup,
      documents: documentsGroup,
      review: reviewGroup,
    });
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewStepComponent, ReactiveFormsModule],
      providers: [FormBuilder],
    }).compileComponents();
  });

  it('should create', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render business information section', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Business Information');
    expect(compiled.textContent).toContain('Test Business');
    expect(compiled.textContent).toContain('John Doe');
    expect(compiled.textContent).toContain('john@test.com');
  });

  it('should render additional contacts section with contacts', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Additional Contacts');
    expect(compiled.textContent).toContain('Jane');
    expect(compiled.textContent).toContain('Manager');
    expect(compiled.textContent).toContain('555-1234');
    expect(compiled.textContent).toContain('jane@test.com');
  });

  it('should render "No additional contacts" when empty', () => {
    const fb = TestBed.inject(FormBuilder);
    const formGroup = fb.group({
      business: fb.group({ businessName: ['Test'], contactName: ['John'], email: ['j@t.com'] }),
      contacts: fb.group({ additionalContacts: fb.array([]) }),
      financial: fb.group({
        taxId: ['123-45-6789'],
        accountNumber: ['12345678'],
        monthlyVolume: [1000],
      }),
      documents: fb.group({
        documentType: ['business_license'],
        document: [new File(['t'], 't.pdf')],
      }),
      review: fb.group({ termsAccepted: [true] }),
    });

    fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('No additional contacts added');
  });

  it('should render financial information section', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Financial Information');
    expect(compiled.textContent).toContain('123-45-6789');
    expect(compiled.textContent).toContain('12345678');
    expect(compiled.textContent).toContain('50000');
  });

  it('should render documents section', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Documents');
    expect(compiled.textContent).toContain('business_license');
    expect(compiled.textContent).toContain('test.pdf');
  });

  it('should render terms checkbox', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('mat-checkbox')).toBeTruthy();
    expect(compiled.textContent).toContain('Terms & Conditions');
  });

  it('should show error when terms not accepted and touched', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    // Manually mark the control as touched and trigger change detection
    const termsControl = (formGroup.controls['review'] as FormGroup).controls['termsAccepted'];
    termsControl.markAsTouched();
    fixture.detectChanges();

    // The termsAccepted is still false, so error should show
    expect(fixture.nativeElement.textContent).toContain('You must accept the terms to proceed');
  });
});
