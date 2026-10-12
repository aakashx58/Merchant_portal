import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import { AppLayoutComponent } from './app-layout.component';
import { PermissionEnum } from '../../../core/constants/permission.enum';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ViewportService } from '../../../core/services/viewport.service';
import { a11yProblems } from '../../../testing/a11y';

const ALL = Object.values(PermissionEnum);

describe('AppLayoutComponent', () => {
  const render = (granted: PermissionEnum[], confirmed = true) => {
    const logout = vi.fn();
    const confirm = vi.fn().mockReturnValue({ afterClosed: () => of(confirmed) });
    TestBed.configureTestingModule({
      imports: [AppLayoutComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: () => ({ username: 'admin' }),
            roles: () => ['admin'],
            can: (p: PermissionEnum) => granted.includes(p),
            logout,
          },
        },
        { provide: DialogService, useValue: { confirm } },
        { provide: ViewportService, useValue: { isMobile: signal(false) } },
      ],
    });
    const fixture = TestBed.createComponent(AppLayoutComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const links = () =>
      Array.from(el.querySelectorAll('mat-sidenav a')).map((a) => a.textContent?.trim());
    return { fixture, el, links, logout, confirm };
  };

  it('always shows the dashboard link', () => {
    expect(render([]).links()).toEqual(
      ['dashboard Dashboard'].map((t) => expect.stringContaining(t.split(' ')[1])),
    );
  });

  it('shows only the links the user has permission for', () => {
    const sales = render([PermissionEnum.application_create]).links().join('|');
    expect(sales).toContain('New application');
    expect(sales).not.toContain('Assignments');
    expect(sales).not.toContain('Users');
    expect(sales).not.toContain('Audit Log');
    expect(sales).not.toContain('Review Queue');
  });

  it('shows every link to an admin', () => {
    TestBed.resetTestingModule();
    const links = render(ALL).links().join('|');
    for (const label of ['Dashboard', 'New application', 'Assignments', 'Users', 'Audit Log']) {
      expect(links).toContain(label);
    }
  });

  it('shows the reviewer queue link only with the assigned-view permission', () => {
    TestBed.resetTestingModule();
    expect(render([PermissionEnum.application_view_assigned]).links().join('|')).toContain(
      'Review Queue',
    );
  });

  it('has a skip link and a focusable main landmark', () => {
    TestBed.resetTestingModule();
    const { el } = render([]);
    expect(el.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main');
    expect(el.querySelector('main#main')?.getAttribute('tabindex')).toBe('-1');
  });

  it('signs out only after confirmation', () => {
    TestBed.resetTestingModule();
    const declined = render([], false);
    (declined.fixture.componentInstance as unknown as { confirmSignOut(): void }).confirmSignOut();
    expect(declined.logout).not.toHaveBeenCalled();

    TestBed.resetTestingModule();
    const accepted = render([], true);
    (accepted.fixture.componentInstance as unknown as { confirmSignOut(): void }).confirmSignOut();
    expect(accepted.logout).toHaveBeenCalled();
  });

  it('has no basic accessibility problems', () => {
    TestBed.resetTestingModule();
    expect(a11yProblems(render(ALL).el)).toEqual([]);
  });
});
