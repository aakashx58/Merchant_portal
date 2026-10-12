import { Component, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { ApplicationAssignmentService } from '../../../../core/services/application-assignment.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-assignment-panel',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './assignment-panel.component.html',
  styleUrl: './assignment-panel.component.scss',
})
export class AssignmentPanelComponent {
  private readonly api = inject(ApplicationAssignmentService);
  private readonly toast = inject(ToastService);

  readonly applicationId = input.required<string>();
  readonly assigneeId = input<string | null>(null);
  readonly assigned = output<void>();

  protected readonly reviewers = rxResource({ stream: () => this.api.reviewers() });
  protected readonly reviewer = new FormControl<string | null>(null, Validators.required);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected save() {
    if (this.reviewer.invalid || this.saving()) {
      this.reviewer.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api
      .assign(this.applicationId(), this.reviewer.value!)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Reviewer assigned');
          this.assigned.emit();
        },
        error: () => this.error.set('Could not assign the reviewer. Please try again.'),
      });
  }
}
