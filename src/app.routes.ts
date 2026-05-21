import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';
import { DemoLayout } from '@/features/demo/demo-layout';
import { Forbidden } from '@/features/forbidden/forbidden';
import { NotFound } from '@/features/not-found/not.found';
import { gestionaleAuthGuard } from '@/auth/gestionale-auth.guard';

export const routes: Routes = [
  {
    path: 'demo',
    component: DemoLayout,
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
      {
        path: '**',
        loadComponent: () =>
          import('@/features/gestionaleCN/placeholder/gestionale-placeholder').then((c) => c.GestionalePlaceholder),
        data: { breadcrumb: 'Demo', title: 'Modulo demo - in sviluppo', demo: true }
      }
    ]
  },
  {
    path: 'faq',
    loadComponent: () => import('@/features/faq/faq').then((c) => c.Faq),
    data: { visibilita: 'pubblica' }
  },
  {
    path: 'privacy',
    loadComponent: () => import('@/features/gestionaleCN/privacy/privacy-info').then((c) => c.PrivacyInfo),
    data: { visibilita: 'pubblica' }
  },
  {
    path: 'completa-profilo',
    loadComponent: () => import('@/features/completa-profilo/completa-profilo').then((c) => c.CompletaProfilo)
  },
  {
    path: 'completa-anagrafica/:token',
    loadComponent: () => import('@/features/gestionaleCN/censimento-comunita/completa-anagrafica').then((c) => c.CompletaAnagrafica)
  },
  {
    path: 'strutture/censimento',
    loadComponent: () => import('@/features/strutture/censimento-struttura').then((c) => c.CensimentoStruttura)
  },
  {
    path: 'area-strutture',
    loadComponent: () => import('@/features/strutture/area-strutture').then((c) => c.AreaStruttureHome)
  },
  {
    path: 'area-strutture/accreditamento',
    loadComponent: () => import('@/features/strutture/area-strutture').then((c) => c.AreaStruttureAccreditamento)
  },
  {
    path: 'area-strutture/in-attesa',
    loadComponent: () => import('@/features/strutture/area-strutture').then((c) => c.AreaStruttureInAttesa)
  },
  {
    path: 'area-strutture/profilo',
    loadComponent: () => import('@/features/strutture/area-strutture').then((c) => c.AreaStruttureProfilo)
  },
  {
    path: 'area-strutture/foto',
    loadComponent: () => import('@/features/strutture/area-strutture').then((c) => c.AreaStruttureFoto)
  },
  {
    path: 'area-strutture/offerte',
    loadComponent: () => import('@/features/strutture/area-strutture').then((c) => c.AreaStruttureOfferte)
  },
  {
    path: 'area-strutture/richieste',
    loadComponent: () => import('@/features/strutture/area-strutture').then((c) => c.AreaStruttureRichieste)
  },
  {
    path: 'gestionale-cn',
    component: AppLayout,
    canMatch: [gestionaleAuthGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('@/features/gestionaleCN/gestionale.routes'),
        data: {
          breadcrumb: 'Gestionale'
        }
      }
    ]
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
