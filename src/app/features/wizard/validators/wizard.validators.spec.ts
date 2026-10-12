import { FormControl } from '@angular/forms';
import { describe, it, expect, vi } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';
import {
  ACCOUNT_PATTERN,
  documentFile,
  MAX_DOCUMENT_BYTES,
  TAX_ID_PATTERN,
  uniqueTaxId,
} from './wizard.validators';

const file = (type: string, size = 10) => ({ type, size }) as File;

describe('documentFile', () => {
  const run = (f: File | null) => documentFile(new FormControl(f));
  it('accepts no file (required is separate)', () => expect(run(null)).toBeNull());
  it('accepts pdf/png/jpeg', () => {
    for (const t of ['application/pdf', 'image/png', 'image/jpeg']) expect(run(file(t))).toBeNull();
  });
  it('rejects other types', () => expect(run(file('text/plain'))).toEqual({ fileType: true }));
  it('rejects files over the limit', () =>
    expect(run(file('application/pdf', MAX_DOCUMENT_BYTES + 1))).toEqual({ fileSize: true }));
  it('accepts a file exactly at the limit', () =>
    expect(run(file('application/pdf', MAX_DOCUMENT_BYTES))).toBeNull());
});

describe('patterns', () => {
  it('tax id accepts plain and masked forms only', () => {
    expect(TAX_ID_PATTERN.test('123-45-6789')).toBe(true);
    expect(TAX_ID_PATTERN.test('***-**-6789')).toBe(true);
    expect(TAX_ID_PATTERN.test('123456789')).toBe(false);
  });
  it('account accepts 8-17 digits or masked', () => {
    expect(ACCOUNT_PATTERN.test('12345678')).toBe(true);
    expect(ACCOUNT_PATTERN.test('12345678901234567')).toBe(true);
    expect(ACCOUNT_PATTERN.test('****1234')).toBe(true);
    expect(ACCOUNT_PATTERN.test('1234567')).toBe(false);
    expect(ACCOUNT_PATTERN.test('123456789012345678')).toBe(false);
  });
});

describe('uniqueTaxId', () => {
  const run = (value: string, api: object) =>
    firstValueFrom(uniqueTaxId(api as never, () => 'd1')(new FormControl(value)) as never);

  it('skips the server for malformed or masked values', async () => {
    const taxIdAvailable = vi.fn();
    expect(await run('bad', { taxIdAvailable })).toBeNull();
    expect(await run('***-**-6789', { taxIdAvailable })).toBeNull();
    expect(taxIdAvailable).not.toHaveBeenCalled();
  });
  it('flags a taken tax id and excludes the current draft', async () => {
    const taxIdAvailable = vi.fn().mockReturnValue(of({ available: false }));
    expect(await run('123-45-6789', { taxIdAvailable })).toEqual({ taxIdTaken: true });
    expect(taxIdAvailable).toHaveBeenCalledWith('123-45-6789', 'd1');
  });
  it('passes when available', async () => {
    expect(await run('123-45-6789', { taxIdAvailable: () => of({ available: true }) })).toBeNull();
  });
  it('does not block the user when the check fails', async () => {
    expect(
      await run('123-45-6789', { taxIdAvailable: () => throwError(() => new Error('x')) }),
    ).toBeNull();
  });
});
