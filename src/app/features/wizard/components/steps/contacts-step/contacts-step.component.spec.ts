import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactsStepComponent } from './contacts-step.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ContactsStepComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ContactsStepComponent>>;
  let component: ContactsStepComponent;

  const createFormGroup = (fb: FormBuilder): FormGroup => fb.group({
    additionalContacts: fb.array<FormGroup>([]),
  });

  const createContactFormGroup = (fb: FormBuilder): FormGroup => fb.group({
    name: ['', Validators.required],
    role: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactsStepComponent, ReactiveFormsModule],
      providers: [FormBuilder],
    }).compileComponents();
  });

  it('should create', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ContactsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should expose additionalContacts as FormArray', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ContactsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    expect(component.additionalContacts).toBeInstanceOf(FormArray);
  });

  it('should emit contactAdded when addContact is called', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ContactsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const spy = vi.spyOn(component.contactAdded, 'emit');
    component.addContact();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit contactRemoved with index when removeContact is called', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ContactsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const spy = vi.spyOn(component.contactRemoved, 'emit');
    component.removeContact(2);
    expect(spy).toHaveBeenCalledWith(2);
  });

  it('should render "No contacts" section when array is empty', () => {
    const formGroup = createFormGroup(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(ContactsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.contacts-section h3')?.textContent).toContain('Additional Contacts');
    expect(compiled.querySelector('.section-hint')?.textContent).toContain('optional');
    expect(compiled.querySelector('button')?.textContent).toContain('Add Contact');
  });

  it('should render contact cards when array has items', () => {
    const fb = TestBed.inject(FormBuilder);
    const formGroup = createFormGroup(fb);
    const contactsArray = formGroup.controls['additionalContacts'] as FormArray;
    contactsArray.push(createContactFormGroup(fb));
    contactsArray.push(createContactFormGroup(fb));

    fixture = TestBed.createComponent(ContactsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const contactCards = compiled.querySelectorAll('.contact-card');
    expect(contactCards.length).toBe(2);
    expect(contactCards[0].querySelector('h4')?.textContent).toContain('Contact #1');
    expect(contactCards[1].querySelector('h4')?.textContent).toContain('Contact #2');
  });

  it('should emit contactRemoved with correct index when delete button clicked', () => {
    const fb = TestBed.inject(FormBuilder);
    const formGroup = createFormGroup(fb);
    const contactsArray = formGroup.controls['additionalContacts'] as FormArray;
    contactsArray.push(createContactFormGroup(fb));
    contactsArray.push(createContactFormGroup(fb));

    fixture = TestBed.createComponent(ContactsStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formGroup', formGroup);
    fixture.detectChanges();

    const spy = vi.spyOn(component.contactRemoved, 'emit');
    const deleteBtn = fixture.nativeElement.querySelectorAll('button[aria-label="Remove contact"]')[1];
    deleteBtn.click();
    expect(spy).toHaveBeenCalledWith(1);
  });
});