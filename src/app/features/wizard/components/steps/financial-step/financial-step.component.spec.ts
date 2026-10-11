import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FinancialStepComponent } from './financial-step.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('FinancialStepComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<FinancialStepComponent>>;

  const createFormGroup = (fb: FormBuilder): FormGroup => fb.group({
    taxId: ['', [Validators.required, Validators.pattern(/^\d{3}-\d{2}-\d{4}$/)]],
    accountNumber: ['', [Validators.required, Validators.pattern(/^\d{8,17}$/)]],
    monthlyVolume: [0, [Validators.required, Validators.min(1)]],
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialStepComponent, ReactiveFormsModule],
      providers: [FormBuilder],
    }).compileComponents();
  });

  it('should create', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(FinancialStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render all three input fields', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(FinancialStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('#taxId')).toBeTruthy();
    expect(compiled.querySelector('#accountNumber')).toBeTruthy();
    expect(compiled.querySelector('#monthlyVolume')).toBeTruthy();
  });

  it('should show required error when taxId is touched and empty', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(FinancialStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#taxId');
    input.focus();
    input.blur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tax ID is required');
  });

  it('should show pattern error when taxId format is invalid', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(FinancialStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#taxId');
    input.value = 'invalid-format';
    input.dispatchEvent(new Event('input'));
    input.focus();
    input.blur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Format must be XXX-XX-XXXX');
  });

  it('should show taxIdTaken error when async validation fails', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(FinancialStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const taxIdControl = formGroup.controls['taxId'];
    taxIdControl.setErrors({ taxIdTaken: true });
    taxIdControl.markAsTouched();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('This Tax ID is already registered');
  });

  it('should show required error when accountNumber is touched and empty', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(FinancialStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#accountNumber');
    input.focus();
    input.blur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Account number is required');
  });

  it('should show pattern error when accountNumber format is invalid', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(FinancialStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#accountNumber');
    input.value = '123';
    input.dispatchEvent(new Event('input'));
    input.focus();
    input.blur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Must be 8-17 digits');
  });

  it('should show min error when monthlyVolume is less than 1', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(FinancialStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#monthlyVolume');
    input.value = '0';
    input.dispatchEvent(new Event('input'));
    input.focus();
    input.blur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Must be at least 1');
  });

  it('should not show errors when fields are filled correctly', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(FinancialStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const taxIdInput = fixture.nativeElement.querySelector('#taxId');
    const accountNumberInput = fixture.nativeElement.querySelector('#accountNumber');
    const monthlyVolumeInput = fixture.nativeElement.querySelector('#monthlyVolume');

    taxIdInput.value = '123-45-6789';
    taxIdInput.dispatchEvent(new Event('input'));
    accountNumberInput.value = '12345678';
    accountNumberInput.dispatchEvent(new Event('input'));
    monthlyVolumeInput.value = '50000';
    monthlyVolumeInput.dispatchEvent(new Event('input'));

    taxIdInput.focus();
    taxIdInput.blur();
    accountNumberInput.focus();
    accountNumberInput.blur();
    monthlyVolumeInput.focus();
    monthlyVolumeInput.blur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('required');
    expect(fixture.nativeElement.textContent).not.toContain('Format must be');
    expect(fixture.nativeElement.textContent).not.toContain('Must be 8-17 digits');
    expect(fixture.nativeElement.textContent).not.toContain('Must be at least 1');
  });
});