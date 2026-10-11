import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-business-info-step',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './business-info-step.component.html',
  styleUrl: './business-info-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessInfoStepComponent {
  readonly formGroup = input.required<FormGroup>();
}