import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MaskedFieldComponent } from './masked-field.component';

describe('MaskedFieldComponent', () => {
  const FULL = '123-45-6789';
  const reveal = vi.fn(() => of(FULL));

  const setup = (revealable = true) => {
    const fixture = TestBed.createComponent(MaskedFieldComponent);
    fixture.componentRef.setInput('label', 'Tax ID');
    fixture.componentRef.setInput('masked', '***-**-6789');
    fixture.componentRef.setInput('revealable', revealable);
    fixture.componentRef.setInput('reveal', reveal);
    fixture.componentRef.setInput('timeoutMs', 5000);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const button = () => el.querySelector('button') as HTMLButtonElement | null;
    return { fixture, el, button };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    reveal.mockClear();
  });

  afterEach(() => vi.useRealTimers());

  it('shows only the masked value and never calls the API before reveal', () => {
    const { el } = setup();
    expect(el.textContent).toContain('***-**-6789');
    expect(el.textContent).not.toContain(FULL);
    expect(reveal).not.toHaveBeenCalled();
  });

  it('shows the full value after reveal and masks it again after the timeout', () => {
    const { fixture, el, button } = setup();

    button()!.click();
    fixture.detectChanges();
    expect(el.textContent).toContain(FULL);

    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(el.textContent).not.toContain(FULL);
    expect(el.textContent).toContain('***-**-6789');
  });

  it('has no reveal button when the user cannot reveal', () => {
    const { button } = setup(false);
    expect(button()).toBeNull();
  });
});
