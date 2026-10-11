import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { catchError, map, Observable, of, switchMap, timer } from 'rxjs';
import { ApplicationDraftService } from '../../../core/services/application-draft.service';

const PLAIN_TAX_ID = /^\d{3}-\d{2}-\d{4}$/;
export const TAX_ID_PATTERN = /^(\d{3}-\d{2}-\d{4}|\*{3}-\*{2}-\d{4})$/;
export const ACCOUNT_PATTERN = /^(\d{8,17}|\*{4}\d{4})$/;

export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export const documentFile: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const file = control.value as File | null;
  if (!file) return null;
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) return { fileType: true };
  if (file.size > MAX_DOCUMENT_BYTES) return { fileSize: true };
  return null;
};

export function uniqueTaxId(
  api: ApplicationDraftService,
  excludeId: () => string | null,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value as string;
    if (!PLAIN_TAX_ID.test(value)) return of(null);
    return timer(300).pipe(
      switchMap(() => api.taxIdAvailable(value, excludeId())),
      map(({ available }) => (available ? null : { taxIdTaken: true })),
      catchError(() => of(null)),
    );
  };
}