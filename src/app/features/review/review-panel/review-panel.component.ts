import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { RiskLevel } from '../../../core/models/application.model';
import { ApplicationsService } from '../../../core/services/applications.service';
import { ToastService } from '../../../core/services/toast.service';

type Decision = 'approved' | 'rejected';

export const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high'];

@Component({
  selector: 'app-review-panel',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './review-panel.component.html',
  styleUrl: './review-panel.component.scss',
})
export class ReviewPanelComponent {
  private readonly api = inject(ApplicationsService);
  private readonly toast = inject(ToastService);

  readonly applicationId = input.required<string>();
  readonly decided = output<void>();

  protected readonly note = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/)],
  });
  protected readonly riskLevels = RISK_LEVELS;
  protected readonly risk = new FormControl<RiskLevel | null>(null, Validators.required);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  private attempt: { decision: Decision; risk: RiskLevel; note: string; key: string } | null = null;

  protected decide(decision: Decision) {
    if (this.submitting()) return;
    if (this.note.invalid || this.risk.invalid) {
      this.note.markAsTouched();
      this.risk.markAsTouched();
      return;
    }

    const note = this.note.value.trim();
    const risk = this.risk.value!;
    // Retrying the same decision reuses the key, so the server applies it only once.
    if (
      this.attempt?.decision !== decision ||
      this.attempt.risk !== risk ||
      this.attempt.note !== note
    ) {
      this.attempt = { decision, risk, note, key: crypto.randomUUID() };
    }

    this.submitting.set(true);
    this.error.set('');
    this.api
      .decide(this.applicationId(), decision, risk, note, this.attempt.key)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.show(`Application ${decision}`);
          this.decided.emit();
        },
        error: (err: HttpErrorResponse) =>
          this.error.set(err.error?.message ?? 'Could not save your decision. Please try again.'),
      });
  }
}
