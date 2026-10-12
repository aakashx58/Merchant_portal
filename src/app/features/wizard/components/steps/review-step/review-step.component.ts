import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-review-step',
  imports: [ReactiveFormsModule, MatCardModule, MatCheckboxModule],
  templateUrl: './review-step.component.html',
  styleUrl: './review-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewStepComponent {
  readonly formGroup = input.required<FormGroup>();

  private get rootForm(): FormGroup {
    const parent = this.formGroup().parent;
    return parent ? (parent as FormGroup) : this.formGroup();
  }

  get businessGroup(): FormGroup {
    return this.rootForm.controls['business'] as FormGroup;
  }

  get contactsGroup(): FormGroup {
    return this.rootForm.controls['contacts'] as FormGroup;
  }

  get financialGroup(): FormGroup {
    return this.rootForm.controls['financial'] as FormGroup;
  }

  get documentsGroup(): FormGroup {
    return this.rootForm.controls['documents'] as FormGroup;
  }

  get reviewGroup(): FormGroup {
    return this.rootForm.controls['review'] as FormGroup;
  }

  get termsAcceptedControl(): FormControl {
    return this.reviewGroup.controls['termsAccepted'] as FormControl;
  }

  get additionalContactsArray(): FormArray {
    return this.contactsGroup.controls['additionalContacts'] as FormArray;
  }
}
