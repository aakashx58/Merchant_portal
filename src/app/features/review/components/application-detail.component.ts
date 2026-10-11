import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionEnum } from '../../../core/constants/permission.enum';
import { Application } from '../../../core/models/application.model';
import { ApplicationsService } from '../../../core/services/applications.service';
import { ApplicationReviewService } from '../../../core/services/application-review.service';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { MaskedFieldComponent } from '../../../shared/components/masked-field/masked-field.component';
import { AssignmentPanelComponent } from './assignment-panel.component';
import { ReviewPanelComponent } from './review-panel.component';

@Component({
  selector: 'app-application-detail',
  imports: [
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    AssignmentPanelComponent,
    DialogComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MaskedFieldComponent,
    ReviewPanelComponent,
  ],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {
  private readonly api = inject(ApplicationsService);
  private readonly reviewApi = inject(ApplicationReviewService);
  private readonly auth = inject(AuthService);

  private readonly id = inject<{ id: string }>(MAT_DIALOG_DATA).id;
  protected readonly dialogRef =
    inject<MatDialogRef<ApplicationDetailComponent, boolean>>(MatDialogRef);

  protected readonly application = rxResource<Application, string>({
    params: () => this.id,
    stream: ({ params }) => this.api.get(params),
  });

  protected readonly canReveal = computed(() => this.auth.can(PermissionEnum.sensitive_reveal));
  protected readonly canReview = computed(() => this.auth.can(PermissionEnum.application_review));
  protected readonly canAssign = computed(() => this.auth.can(PermissionEnum.application_assign));
  protected readonly currentUserId = computed(() => this.auth.user()?.id);
  protected readonly history = computed(() =>
    [...(this.application.value()?.history ?? [])].reverse(),
  );
  protected readonly isOwn = computed(
    () => this.application.value()?.ownerId === this.auth.user()?.id,
  );

  protected readonly revealTaxId = () => this.reviewApi.reveal(this.id, 'taxId');
  protected readonly revealAccount = () => this.reviewApi.reveal(this.id, 'accountNumber');
}
