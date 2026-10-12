import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { ViewportService } from '../../../core/services/viewport.service';
import { WizardStore } from '../stores/wizard.store';
import { BusinessInfoStepComponent } from './steps/business-info-step/business-info-step.component';
import { ContactsStepComponent } from './steps/contacts-step/contacts-step.component';
import { FinancialStepComponent } from './steps/financial-step/financial-step.component';
import { DocumentsStepComponent } from './steps/documents-step/documents-step.component';
import { ReviewStepComponent } from './steps/review-step/review-step.component';

@Component({
  selector: 'app-wizard',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    BusinessInfoStepComponent,
    ContactsStepComponent,
    FinancialStepComponent,
    DocumentsStepComponent,
    ReviewStepComponent,
  ],
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
}
