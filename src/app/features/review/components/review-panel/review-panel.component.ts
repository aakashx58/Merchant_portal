import { TitleCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize, map, merge } from 'rxjs';
import { RiskLevel } from '../../../../core/models/application.model';
import { ApplicationReviewService } from '../../services/application-review.service';
import { ToastService } from '../../../../core/services/toast.service';

type Decision = 'approved' | 'rejected';

export const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high'];

@Component({
  selector: 'app-review-panel',
  imports: [
    TitleCasePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './review-panel.component.html',
  styleUrl: './review-panel.component.scss',
})
export class ReviewPanelComponent {
  private readonly api = inject(ApplicationReviewService);
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

  /** Approve / Reject stay disabled until both a note and a risk level are given. */
  protected readonly canDecide = toSignal(
    merge(this.note.statusChanges, this.risk.statusChanges).pipe(
      map(() => this.note.valid && this.risk.valid),
    ),
    { initialValue: false },
  );
  /** The decision waiting for an explicit confirmation, shown inline in the card. */
  protected readonly pending = signal<Decision | null>(null);

  protected ask(decision: Decision) {
    if (this.submitting() || !this.canDecide()) return;
    this.pending.set(decision);
  }

  protected cancel() {
    this.pending.set(null);
  }

  protected submit(decision: Decision) {
    if (this.submitting() || !this.canDecide()) return;
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
          this.pending.set(null);
          this.toast.show(`Application ${decision}`);
          this.decided.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.pending.set(null);
          this.error.set(err.error?.message ?? 'Could not save your decision. Please try again.');
        },
      });
  }
}
