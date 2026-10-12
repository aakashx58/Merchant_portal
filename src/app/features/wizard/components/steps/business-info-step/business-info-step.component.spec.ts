import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BusinessInfoStepComponent } from './business-info-step.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('BusinessInfoStepComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<BusinessInfoStepComponent>>;

  const createFormGroup = (fb: FormBuilder): FormGroup =>
    fb.group({
      businessName: ['', Validators.required],
      contactName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessInfoStepComponent, ReactiveFormsModule],
      providers: [FormBuilder],
    }).compileComponents();
  });

  it('should create', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(BusinessInfoStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render all three input fields', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(BusinessInfoStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('#businessName')).toBeTruthy();
    expect(compiled.querySelector('#contactName')).toBeTruthy();
    expect(compiled.querySelector('#email')).toBeTruthy();
  });

  it('should show required error when businessName is touched and empty', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(BusinessInfoStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#businessName');
    input.focus();
    input.blur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Business name is required');
  });

  it('should show required error when contactName is touched and empty', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(BusinessInfoStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#contactName');
    input.focus();
    input.blur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Contact name is required');
  });

  it('should show required and email error when email is touched and empty', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(BusinessInfoStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#email');
    input.focus();
    input.blur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Email is required');
  });

  it('should show email format error when email is invalid', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(BusinessInfoStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#email');
    input.value = 'invalid-email';
    input.dispatchEvent(new Event('input'));
    input.focus();
    input.blur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Enter a valid email address');
  });

  it('should not show errors when fields are filled correctly', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(BusinessInfoStepComponent);
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const businessNameInput = fixture.nativeElement.querySelector('#businessName');
    const contactNameInput = fixture.nativeElement.querySelector('#contactName');
    const emailInput = fixture.nativeElement.querySelector('#email');

    businessNameInput.value = 'Test Business';
    businessNameInput.dispatchEvent(new Event('input'));
    contactNameInput.value = 'John Doe';
    contactNameInput.dispatchEvent(new Event('input'));
    emailInput.value = 'john@test.com';
    emailInput.dispatchEvent(new Event('input'));

    businessNameInput.focus();
    businessNameInput.blur();
    contactNameInput.focus();
    contactNameInput.blur();
    emailInput.focus();
    emailInput.blur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('required');
    expect(fixture.nativeElement.textContent).not.toContain('valid email');
  });
});
