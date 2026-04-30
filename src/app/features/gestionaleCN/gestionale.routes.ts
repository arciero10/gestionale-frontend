import { Routes } from "@angular/router";
import { CreaConvivenza } from "./convivenze/crea.convivevenza";
import { CreaViaggio } from "./viaggi/crea.viaggio";
import { GestionalePlaceholder } from "./placeholder/gestionale-placeholder";
import { Convivenze } from "./convivenze/convivenze";


 export default [
        {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
        {
        path: 'dashboard',
        loadComponent: () => import('../dashboards/dashboard').then((c) => c.Dashboard),
        data: { breadcrumb: 'Dashboard' }
    },
        {
        path: 'onboarding-comunita',
        loadComponent: () => import('./onboarding-comunita/onboarding-comunita').then((c) => c.OnboardingComunita),
        data: { breadcrumb: 'Associa comunità' }
    },
        {
        path: 'onboarding-comunita-preview',
        loadComponent: () => import('./onboarding-comunita/onboarding-comunita').then((c) => c.OnboardingComunita),
        data: { breadcrumb: 'Anteprima primo accesso', preview: true }
    },
        {
        path: 'faq',
        loadComponent: () => import('../faq/faq').then((c) => c.Faq),
        data: { breadcrumb: 'Aiuto / FAQ', visibilita: 'interna' }
    },
        {
        path: 'privacy/compila',
        loadComponent: () => import('./privacy/compila-privacy').then((c) => c.CompilaPrivacy),
        data: { breadcrumb: 'Compila privacy' }
    },
        {
        path: 'comunita',
        loadComponent: () => import('./comunita/comunita').then((c) => c.Comunita),
        data: { breadcrumb: 'La tua Comunità' }
    },
        {
        path: 'posti-convivenza/mappa',
        loadComponent: () => import('./posti-convivenza/posti-convivenza-mappa').then((c) => c.PostiConvivenzaMappa),
        data: { breadcrumb: 'Mappa posti di Convivenza' }
    },
        {
        path: 'posti-convivenza',
        loadComponent: () => import('./posti-convivenza/posti-convivenza').then((c) => c.PostiConvivenza),
        data: { breadcrumb: 'Posti di Convivenza' }
    },
        {
        path: 'convivenze',
        component: Convivenze,
        data: { breadcrumb: 'Convivenze' }
    },
        {
        path: 'richieste-strutture',
        loadComponent: () => import('./richieste-strutture/richieste-strutture').then((c) => c.RichiesteStrutture),
        data: { breadcrumb: 'Richieste strutture' }
    },
         {
        path: 'convivenze/:type',
        loadComponent: () => import('./kanban').then((c) => c.Kanban),
        data: { breadcrumb: 'Convivenze' }
    },
      {
        path: 'viaggi',
        component: GestionalePlaceholder,
        data: { breadcrumb: 'Viaggi / Pellegrinaggi', title: 'Viaggi / Pellegrinaggi - in sviluppo' }
      },
      { path: 'viaggi/:type', component: CreaViaggio, data: { breadcrumb: 'Viaggi' } },
      { path: '**', redirectTo: 'dashboard' }
     //     { path: 'empty', component: Empty },
     //     { path: 'invoice', component: Invoice, data: { breadcrumb: 'Invoice' } },
     //     { path: 'aboutus', component: AboutUs },
     //     { path: 'help', component: Help, data: { breadcrumb: 'Help' } },
     //     { path: 'contact', component: ContactUs },
 ] as Routes;
