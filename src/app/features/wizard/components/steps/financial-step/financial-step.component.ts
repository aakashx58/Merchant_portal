import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-financial-step',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatProgressBarModule],
  templateUrl: './financial-step.component.html',
  styleUrl: './financial-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialStepComponent {
  readonly formGroup = input.required<FormGroup>();
}
