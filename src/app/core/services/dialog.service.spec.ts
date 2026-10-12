import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { DialogService } from './dialog.service';

describe('DialogService.openSideSheet', () => {
  const setup = () => {
    const keys = new Subject<Partial<KeyboardEvent>>();
    const ref = { keydownEvents: () => keys, close: vi.fn() };
    const open = vi.fn().mockReturnValue(ref);
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: { open } }] });
    const sheet = TestBed.inject(DialogService).openSideSheet(class {});
    return { open, keys, ref, sheet };
  };

  it('cannot be closed by clicking the backdrop', () => {
    expect(setup().open.mock.calls[0][1]).toMatchObject({ disableClose: true });
  });

  it('still closes with Escape, and ignores other keys', () => {
    const { keys, ref } = setup();
    keys.next({ key: 'a' });
    expect(ref.close).not.toHaveBeenCalled();
    keys.next({ key: 'Escape' });
    expect(ref.close).toHaveBeenCalledTimes(1);
  });

  it('lets a caller override the defaults', () => {
    const keys = new Subject<Partial<KeyboardEvent>>();
    const open = vi.fn().mockReturnValue({ keydownEvents: () => keys, close: vi.fn() });
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: { open } }] });
    TestBed.inject(DialogService).openSideSheet(class {}, { disableClose: false });
    expect(open.mock.calls[0][1]).toMatchObject({ disableClose: false });
  });
});
