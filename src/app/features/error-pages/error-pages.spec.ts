import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { NotFoundComponent } from './not-found/not-found.component';
import { ServerErrorComponent } from './server-error/server-error.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

describe.each([
  ['404', NotFoundComponent],
  ['500', ServerErrorComponent],
  ['403', UnauthorizedComponent],
] as [string, Type<unknown>][])('%s page', (code, component) => {
  it('renders its error code and a dashboard action', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain(code);
    expect(el.querySelector('button')).toBeTruthy();
  });
});

describe('ServerErrorComponent navigation', () => {
  it('goes to the dashboard', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ServerErrorComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(nav).toHaveBeenCalledWith(['/dashboard']);
  });
});
