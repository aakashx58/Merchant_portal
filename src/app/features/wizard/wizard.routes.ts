import { Routes } from '@angular/router';

export const ROUTES: Routes = [
  { path: '', loadComponent: () => import('./wizard.component').then((m) => m.WizardComponent) },
];
