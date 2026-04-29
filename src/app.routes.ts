import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';
import { Forbidden } from '@/features/forbidden/forbidden';
import { NotFound } from '@/features/not-found/not.found';

export const routes: Routes = [
  {
    path: 'demo',
    component: AppLayout,
    data: { demo: true },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@/features/dashboards/dashboard').then((c) => c.Dashboard),
        data: { breadcrumb: 'Dashboard demo', demo: true }
      },
      {
        path: 'comunita',
        loadComponent: () =>
          import('@/features/gestionaleCN/comunita/comunita').then((c) => c.Comunita),
        data: { breadcrumb: 'La tua Comunità demo', demo: true }
      },
      {
        path: 'convivenze',
        loadComponent: () =>
          import('@/features/gestionaleCN/convivenze/convivenze').then((c) => c.Convivenze),
        data: { breadcrumb: 'Convivenze demo', demo: true }
      },
      {
        path: 'posti-convivenza/mappa',
        loadComponent: () =>
          import('@/features/gestionaleCN/posti-convivenza/posti-convivenza-mappa').then((c) => c.PostiConvivenzaMappa),
        data: { breadcrumb: 'Mappa posti demo', demo: true }
      },
      {
        path: 'posti-convivenza',
        loadComponent: () =>
          import('@/features/gestionaleCN/posti-convivenza/posti-convivenza').then((c) => c.PostiConvivenza),
        data: { breadcrumb: 'Posti di Convivenza demo', demo: true }
      },
      {
        path: 'viaggi',
        loadComponent: () =>
          import('@/features/gestionaleCN/placeholder/gestionale-placeholder').then((c) => c.GestionalePlaceholder),
        data: { breadcrumb: 'Viaggi / Pellegrinaggi demo', title: 'Viaggi / Pellegrinaggi - demo', demo: true }
      },
      { path: '**', redirectTo: 'dashboard' }
    ]
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
