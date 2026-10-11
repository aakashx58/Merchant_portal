import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ReactiveFormsModule } from '@angular/forms';
import { ViewportService } from '../../../core/services/viewport.service';
import { WizardStore } from '../stores/wizard.store';

@Component({
  selector: 'app-wizard',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatStepperModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './wizard.component.html',
  styleUrl: './wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardComponent implements OnInit, OnDestroy {
  protected readonly store = inject(WizardStore);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isMobile = inject(ViewportService).isMobile;

  ngOnInit() {
    this.store.load();
  }

  ngOnDestroy() {
    this.store.saveOnDestroy();
  }

  protected nextStep() {
    this.store.nextStep();
  }

  protected previousStep() {
    this.store.previousStep();
  }

  protected onFile(event: Event) {
    this.store.onFile(event);
  }

  protected removeFile() {
    this.store.removeFile();
  }

  protected submit() {
    this.store.submit();
  }

  protected addContact() {
    this.store.addContact({ name: '', role: '', phone: '', email: '' });
  }

  protected removeContact(index: number) {
    this.store.removeContact(index);
  }

  protected onStepChange() {
    this.store.onStepChange();
  }

  protected trackByIndex(index: number): number {
    return index;
  }
}