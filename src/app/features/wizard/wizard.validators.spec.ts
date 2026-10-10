import { FormControl } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationDraftService } from '../../core/services/application-draft.service';
import {
  ACCOUNT_PATTERN,
  documentFile,
  MAX_DOCUMENT_BYTES,
  TAX_ID_PATTERN,
  uniqueTaxId,
} from './wizard.validators';

const file = (type: string, size: number) => ({ type, size }) as File;

describe('wizard validators', () => {
  it('validates tax id format, accepting the masked form', () => {
    expect(TAX_ID_PATTERN.test('123-45-6789')).toBe(true);
    expect(TAX_ID_PATTERN.test('***-**-6789')).toBe(true);
    expect(TAX_ID_PATTERN.test('123456789')).toBe(false);
  });

  it('validates account number format, accepting the masked form', () => {
    expect(ACCOUNT_PATTERN.test('12345678')).toBe(true);
    expect(ACCOUNT_PATTERN.test('****6789')).toBe(true);
    expect(ACCOUNT_PATTERN.test('1234')).toBe(false);
  });

  it('checks document type and size', () => {
    const run = (f: File | null) => documentFile(new FormControl(f));
    expect(run(null)).toBeNull();
    expect(run(file('application/pdf', 1000))).toBeNull();
    expect(run(file('text/plain', 1000))).toEqual({ fileType: true });
    expect(run(file('image/png', MAX_DOCUMENT_BYTES + 1))).toEqual({ fileSize: true });
  });

  describe('uniqueTaxId', () => {
    const validate = (api: Partial<ApplicationDraftService>, value: string) =>
      new Promise((resolve) => {
        vi.useFakeTimers();
        const result$ = uniqueTaxId(
          api as ApplicationDraftService,
          () => 'app-1',
        )(new FormControl(value)) as ReturnType<typeof of>;
        result$.subscribe(resolve);
        vi.advanceTimersByTime(300);
        vi.useRealTimers();
      });

    it('flags a tax id that is already taken', async () => {
      const api = { taxIdAvailable: () => of({ available: false }) };
      expect(await validate(api, '123-45-6789')).toEqual({ taxIdTaken: true });
    });

    it('passes when the tax id is free', async () => {
      const api = { taxIdAvailable: () => of({ available: true }) };
      expect(await validate(api, '123-45-6789')).toBeNull();
    });

    it('passes on a network error instead of blocking the user', async () => {
      const api = { taxIdAvailable: () => throwError(() => new Error('offline')) };
      expect(await validate(api, '123-45-6789')).toBeNull();
    });

    it('skips the lookup for a masked or malformed value', async () => {
      const taxIdAvailable = vi.fn();
      expect(await validate({ taxIdAvailable }, '***-**-6789')).toBeNull();
      expect(taxIdAvailable).not.toHaveBeenCalled();
    });
  });
});
