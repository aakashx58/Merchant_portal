import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface DocumentType {
  value: string;
  label: string;
}

@Component({
  selector: 'app-documents-step',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './documents-step.component.html',
  styleUrl: './documents-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsStepComponent {
  readonly formGroup = input.required<FormGroup>();
  readonly documentTypes = input.required<DocumentType[]>();

  readonly fileSelected = output<Event>();
  readonly fileRemoved = output<void>();

  onFile(event: Event): void {
    this.fileSelected.emit(event);
  }

  removeFile(): void {
    this.fileRemoved.emit();
  }
}