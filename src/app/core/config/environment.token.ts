import { InjectionToken } from '@angular/core';
import { Environment } from '../../../environments/environment.model';

export const ENVIRONMENT = new InjectionToken<Environment>('ENVIRONMENT');

export function provideEnvironment(env: Environment) {
  return { provide: ENVIRONMENT, useValue: env };
}