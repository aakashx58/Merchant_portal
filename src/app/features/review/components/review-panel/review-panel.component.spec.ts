import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ReviewPanelComponent } from './review-panel.component';
import { ApplicationReviewService } from '../../services/application-review.service';
import { ToastService } from '../../../../core/services/toast.service';

interface PanelApi {
  note: { setValue(v: string): void };
  risk: { setValue(v: string): void };
}

describe('ReviewPanelComponent', () => {
  let decide: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<ReviewPanelComponent>;
  let el: HTMLElement;

  const button = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim().includes(text)) as
      HTMLButtonElement | undefined;

  const fill = () => {
    const panel = fixture.componentInstance as unknown as PanelApi;
    panel.note.setValue('Looks fine');
    panel.risk.setValue('low');
    fixture.detectChanges();
  };

  beforeEach(() => {
    decide = vi.fn().mockReturnValue(of({}));
    TestBed.configureTestingModule({
      providers: [
        { provide: ApplicationReviewService, useValue: { decide } },
        { provide: ToastService, useValue: { show: vi.fn() } },
      ],
    });
    fixture = TestBed.createComponent(ReviewPanelComponent);
    fixture.componentRef.setInput('applicationId', 'app-1');
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('disables Approve and Reject until both a note and a risk level are given', () => {
    expect(button('Approve')!.disabled).toBe(true);
    expect(button('Reject')!.disabled).toBe(true);
    (fixture.componentInstance as unknown as PanelApi).note.setValue('only a note');
    fixture.detectChanges();
    expect(button('Approve')!.disabled).toBe(true);
    fill();
    expect(button('Approve')!.disabled).toBe(false);
    expect(button('Reject')!.disabled).toBe(false);
  });

  it('treats a whitespace-only note as empty', () => {
    const panel = fixture.componentInstance as unknown as PanelApi;
    panel.note.setValue('   ');
    panel.risk.setValue('low');
    fixture.detectChanges();
    expect(button('Approve')!.disabled).toBe(true);
  });

  it('asks inline before approving and sends nothing yet', () => {
    fill();
    button('Approve')!.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Approve this application?');
    expect(decide).not.toHaveBeenCalled();
  });

  it('shows a red confirm button when rejecting', () => {
    fill();
    button('Reject')!.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Reject this application?');
    expect(button('Yes, reject')!.classList).toContain('btn-danger');
  });

  it('Cancel goes back to the buttons without sending', () => {
    fill();
    button('Approve')!.click();
    fixture.detectChanges();
    button('Cancel')!.click();
    fixture.detectChanges();
    expect(button('Approve')).toBeTruthy();
    expect(decide).not.toHaveBeenCalled();
  });

  it('sends the decision only after the explicit confirmation', () => {
    const decided = vi.fn();
    fixture.componentInstance.decided.subscribe(decided);
    fill();
    button('Reject')!.click();
    fixture.detectChanges();
    button('Yes, reject')!.click();
    expect(decide).toHaveBeenCalledWith(
      'app-1',
      'rejected',
      'low',
      'Looks fine',
      expect.any(String),
    );
    expect(decided).toHaveBeenCalled();
  });

  it('returns to the buttons and shows the server message when saving fails', () => {
    decide.mockReturnValue(throwError(() => ({ error: { message: 'Not assigned to you' } })));
    fill();
    button('Approve')!.click();
    fixture.detectChanges();
    button('Yes, approve')!.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Not assigned to you');
    expect(button('Approve')).toBeTruthy();
  });
});
