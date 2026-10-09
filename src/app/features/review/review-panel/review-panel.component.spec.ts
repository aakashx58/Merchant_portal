import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from '../../../core/services/toast.service';
import { ReviewPanelComponent } from './review-panel.component';

describe('ReviewPanelComponent', () => {
  let httpMock: HttpTestingController;
  let el: HTMLElement;
  let decided: ReturnType<typeof vi.fn>;
  let fixture: ReturnType<typeof TestBed.createComponent<ReviewPanelComponent>>;

  const buttons = () => Array.from(el.querySelectorAll('button')) as HTMLButtonElement[];
  const click = (label: string) => {
    buttons()
      .find((b) => b.textContent?.includes(label))!
      .click();
    fixture.detectChanges();
  };
  const pickRisk = (level: string) => {
    (el.querySelector('mat-select .mat-mdc-select-trigger') as HTMLElement).click();
    fixture.detectChanges();
    const option = Array.from(document.querySelectorAll('mat-option')).find((o) =>
      o.textContent?.toLowerCase().includes(level),
    ) as HTMLElement;
    option.click();
    fixture.detectChanges();
  };
  const type = (note: string) => {
    const textarea = el.querySelector('textarea')!;
    textarea.value = note;
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: { show: vi.fn() } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ReviewPanelComponent);
    fixture.componentRef.setInput('applicationId', 'app-2');
    decided = vi.fn();
    fixture.componentInstance.decided.subscribe(decided);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('does not send a decision without a note', () => {
    click('Approve');
    httpMock.expectNone(() => true);
    expect(decided).not.toHaveBeenCalled();
  });

  it('blocks a second click while the decision is in flight', () => {
    type('Looks good');
    pickRisk('low');
    click('Approve');

    expect(buttons().every((b) => b.disabled)).toBe(true);
    click('Approve');

    const req = httpMock.expectOne('/api/applications/app-2/decision');
    expect(req.request.body).toEqual({
      decision: 'approved',
      riskLevel: 'low',
      note: 'Looks good',
    });
    req.flush({});
    expect(decided).toHaveBeenCalledTimes(1);
  });

  it('retries a failed decision with the same idempotency key', () => {
    type('Not enough documents');
    pickRisk('high');
    click('Reject');
    const first = httpMock.expectOne('/api/applications/app-2/decision');
    first.flush({ message: 'Server busy' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el.textContent).toContain('Server busy');

    click('Reject');
    const retry = httpMock.expectOne('/api/applications/app-2/decision');
    expect(retry.request.headers.get('Idempotency-Key')).toBe(
      first.request.headers.get('Idempotency-Key'),
    );
    retry.flush({});
  });
});
