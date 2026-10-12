import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-contacts-step',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './contacts-step.component.html',
  styleUrl: './contacts-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsStepComponent {
  readonly formGroup = input.required<FormGroup>();

  readonly contactAdded = output<void>();
  readonly contactRemoved = output<number>();

  get additionalContacts(): FormArray {
    return this.formGroup().controls['additionalContacts'] as FormArray;
  }

  addContact(): void {
    this.contactAdded.emit();
  }

  removeContact(index: number): void {
    this.contactRemoved.emit(index);
  }
}
