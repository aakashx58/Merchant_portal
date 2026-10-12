import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DocumentsStepComponent } from './documents-step.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DocumentsStepComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<DocumentsStepComponent>>;
  let component: DocumentsStepComponent;

  const createFormGroup = (fb: FormBuilder): FormGroup =>
    fb.group({
      documentType: ['', Validators.required],
      document: [null as File | null, Validators.required],
    });

  const documentTypes = [
    { value: 'business_license', label: 'Business license' },
    { value: 'bank_statement', label: 'Bank statement' },
    { value: 'id_card', label: 'ID card' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentsStepComponent, ReactiveFormsModule],
      providers: [FormBuilder],
    }).compileComponents();
  });

  it('should create', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(DocumentsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.componentRef.setInput('documentTypes', documentTypes);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render document type select with all options', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(DocumentsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.componentRef.setInput('documentTypes', documentTypes);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const select = compiled.querySelector('#documentType');
    expect(select).toBeTruthy();
    const options = select?.querySelectorAll('option');
    expect(options?.length).toBe(3);
    expect(options?.[0].textContent).toContain('Business license');
    expect(options?.[1].textContent).toContain('Bank statement');
    expect(options?.[2].textContent).toContain('ID card');
  });

  it('should render file upload area', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(DocumentsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.componentRef.setInput('documentTypes', documentTypes);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.file-label')).toBeTruthy();
    expect(compiled.querySelector('#document')).toBeTruthy();
    expect(compiled.querySelector('button[mat-stroked-button]')).toBeTruthy();
  });

  it('should show placeholder text when no file selected', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(DocumentsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.componentRef.setInput('documentTypes', documentTypes);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Choose file');
  });

  it('should emit fileSelected when onFile is called', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(DocumentsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.componentRef.setInput('documentTypes', documentTypes);
    fixture.detectChanges();

    const spy = vi.spyOn(component.fileSelected, 'emit');
    const mockEvent = new Event('change');
    component.onFile(mockEvent);
    expect(spy).toHaveBeenCalledWith(mockEvent);
  });

  it('should emit fileRemoved when removeFile is called', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(DocumentsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.componentRef.setInput('documentTypes', documentTypes);
    fixture.detectChanges();

    const spy = vi.spyOn(component.fileRemoved, 'emit');
    component.removeFile();
    expect(spy).toHaveBeenCalled();
  });

  it('should show required error when document is touched and no file', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(DocumentsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.componentRef.setInput('documentTypes', documentTypes);
    fixture.detectChanges();

    // The document control is the nested control
    const documentControl = formGroup.controls['document'];
    documentControl.markAsTouched();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Document is required');
  });

  it('should show fileType error when set', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(DocumentsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.componentRef.setInput('documentTypes', documentTypes);
    fixture.detectChanges();

    const documentControl = formGroup.controls['document'];
    documentControl.setErrors({ fileType: true });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Only PDF, PNG, and JPG files are allowed');
  });

  it('should show fileSize error when set', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(DocumentsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.componentRef.setInput('documentTypes', documentTypes);
    fixture.detectChanges();

    const documentControl = formGroup.controls['document'];
    documentControl.setErrors({ fileSize: true });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('File size must not exceed 5MB');
  });
});
