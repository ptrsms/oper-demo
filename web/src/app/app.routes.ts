import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { AnonLayoutComponent } from './shared/anon-layout.component';
import { AppShellComponent } from './shared/app-shell.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'simulate' },

  {
    path: '',
    component: AnonLayoutComponent,
    children: [
      {
        path: 'simulate',
        loadComponent: () =>
          import('./features/simulator/simulator.component').then(
            (m) => m.SimulatorComponent
          )
      },
      {
        path: 'simulate/:id',
        loadComponent: () =>
          import('./features/simulator/simulator-result.component').then(
            (m) => m.SimulatorResultComponent
          )
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./features/auth/signup.component').then((m) => m.SignupComponent)
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.component').then((m) => m.LoginComponent)
      }
    ]
  },

  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          )
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents-redirect.component').then(
            (m) => m.DocumentsRedirectComponent
          )
      },
      {
        path: 'applications/:id',
        loadComponent: () =>
          import(
            './features/application/application-wizard-shell.component'
          ).then((m) => m.ApplicationWizardShellComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'property' },
          {
            path: 'property',
            loadComponent: () =>
              import('./features/application/steps/property-step.component').then(
                (m) => m.PropertyStepComponent
              )
          },
          {
            path: 'financials',
            loadComponent: () =>
              import('./features/application/steps/financials-step.component').then(
                (m) => m.FinancialsStepComponent
              )
          },
          {
            path: 'personal',
            loadComponent: () =>
              import('./features/application/steps/personal-step.component').then(
                (m) => m.PersonalStepComponent
              )
          },
          {
            path: 'documents',
            loadComponent: () =>
              import('./features/application/steps/documents.component').then(
                (m) => m.DocumentsComponent
              )
          },
          {
            path: 'submitted',
            loadComponent: () =>
              import('./features/application/steps/submitted.component').then(
                (m) => m.SubmittedComponent
              )
          }
        ]
      }
    ]
  },

  { path: '**', redirectTo: 'simulate' }
];
