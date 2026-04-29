import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';
import { Forbidden } from '@/features/forbidden/forbidden';
import { NotFound } from '@/features/not-found/not.found';

export const routes: Routes = [
  {
    path: 'demo',
    loadComponent: () => import('@/features/demo/demo').then((c) => c.Demo)
  },
  {
    path: 'demo/:section',
    loadComponent: () => import('@/features/demo/demo').then((c) => c.Demo)
  },
  {
    path: 'faq',
    loadComponent: () => import('@/features/faq/faq').then((c) => c.Faq),
    data: { visibilita: 'pubblica' }
  },
  {
    path: 'completa-profilo',
    loadComponent: () => import('@/features/completa-profilo/completa-profilo').then((c) => c.CompletaProfilo)
  },
  {
    path: '',
    component: AppLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@/features/dashboards/dashboard').then((c) => c.Dashboard),
        data: {
          breadcrumb: 'Gestione Viaggi e Incontri'
        }
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@/features/dashboards/dashboard').then((c) => c.Dashboard),
        data: {
          breadcrumb: 'Banking Dashboard'
        }
      },
      {
        path: 'gestionale-cn',
        loadChildren: () => import('@/features/gestionaleCN/gestionale.routes'),
        data: {
          breadcrumb: 'Gestionale'
        }
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('@/features/gestionaleCN/usermanagement/usermanagement.routes'),
        data: {
          breadcrumb: 'Gestione Partecipanti'
        }
      }
    ]
  },
  { path: 'forbidden', component: Forbidden },
  { path: '**', component: NotFound }
];
