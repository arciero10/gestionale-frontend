import { Routes } from "@angular/router";
import { CreaConvivenza } from "./convivenze/crea.convivevenza";
import { CreaViaggio } from "./viaggi/crea.viaggio";
import { GestionalePlaceholder } from "./placeholder/gestionale-placeholder";
import { Convivenze } from "./convivenze/convivenze";
import { platformAdminGuard } from "./admin/platform-admin.mock";


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
        path: 'privacy',
        loadComponent: () => import('./privacy/privacy-info').then((c) => c.PrivacyInfo),
        data: { breadcrumb: 'Privacy' }
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
        path: 'censimento-comunita',
        loadComponent: () => import('./censimento-comunita/censimento-comunita').then((c) => c.CensimentoComunita),
        data: { breadcrumb: 'Censimento comunità' }
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
        path: 'catalogo-strutture',
        redirectTo: 'posti-convivenza',
        pathMatch: 'full'
    },
        {
        path: 'admin',
        canMatch: [platformAdminGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./admin/global-admin-dashboard').then((c) => c.GlobalAdminDashboard),
                data: { breadcrumb: 'Admin piattaforma' }
            },
            {
                path: 'utenti',
                loadComponent: () => import('./admin/admin-section-placeholder').then((c) => c.AdminSectionPlaceholder),
                data: { breadcrumb: 'Utenti', title: 'Utenti e ruoli', description: 'Gestione globale utenti, ruoli applicativi e abilitazioni.' }
            },
            {
                path: 'comunita',
                loadComponent: () => import('./admin/admin-section-placeholder').then((c) => c.AdminSectionPlaceholder),
                data: { breadcrumb: 'Comunità', title: 'Comunità', description: 'Gestione globale di diocesi, settori, parrocchie e comunità.' }
            },
            {
                path: 'profili',
                loadComponent: () => import('./admin/admin-section-placeholder').then((c) => c.AdminSectionPlaceholder),
                data: { breadcrumb: 'Profili', title: 'Profili/fratelli', description: 'Consultazione e correzione dei profili personali censiti.' }
            },
            {
                path: 'strutture',
                loadComponent: () => import('./admin-strutture/admin-strutture').then((c) => c.AdminStrutture),
                data: { breadcrumb: 'Admin strutture' }
            },
            {
                path: 'convivenze',
                loadComponent: () => import('./admin/admin-section-placeholder').then((c) => c.AdminSectionPlaceholder),
                data: { breadcrumb: 'Convivenze', title: 'Convivenze', description: 'Controllo globale di convivenze attive, concluse e catechistiche.' }
            },
            {
                path: 'richieste',
                loadComponent: () => import('./admin/admin-section-placeholder').then((c) => c.AdminSectionPlaceholder),
                data: { breadcrumb: 'Richieste', title: 'Richieste disponibilità', description: 'Monitoraggio globale delle richieste disponibilità verso le strutture.' }
            },
            {
                path: 'viaggi',
                loadComponent: () => import('./admin/admin-section-placeholder').then((c) => c.AdminSectionPlaceholder),
                data: { breadcrumb: 'Viaggi', title: 'Viaggi / Pellegrinaggi', description: 'Governo globale di viaggi e pellegrinaggi quando il modulo sarà attivo.' }
            },
            {
                path: 'impostazioni',
                loadComponent: () => import('./admin/admin-section-placeholder').then((c) => c.AdminSectionPlaceholder),
                data: { breadcrumb: 'Impostazioni', title: 'Impostazioni', description: 'Configurazioni generali, privacy e parametri del gestionale.' }
            }
        ]
    },
        {
        path: 'admin-strutture',
        redirectTo: 'admin/strutture',
        pathMatch: 'full'
    },
        {
        path: 'catechista',
        redirectTo: 'catechista/dashboard',
        pathMatch: 'full'
    },
        {
        path: 'catechista/dashboard',
        loadComponent: () => import('./catechista/catechista-dashboard').then((c) => c.CatechistaDashboard),
        data: { breadcrumb: 'Area Catechista' }
    },
        {
        path: 'catechista/comunita-figlie',
        component: GestionalePlaceholder,
        data: { breadcrumb: 'Comunità seguite', title: 'Comunità seguite - in sviluppo' }
    },
        {
        path: 'catechista/convivenze',
        component: Convivenze,
        data: { breadcrumb: 'Convivenze catechistiche' }
    },
        {
        path: 'catechista/equipe',
        component: GestionalePlaceholder,
        data: { breadcrumb: 'Equipe catechisti', title: 'Equipe catechisti - in sviluppo' }
    },
        {
        path: 'catechista/calendario',
        component: GestionalePlaceholder,
        data: { breadcrumb: 'Calendario catechista', title: 'Calendario catechista - in sviluppo' }
    },
        {
        path: 'responsabile/dashboard',
        loadComponent: () => import('./responsabile/responsabile-dashboard').then((c) => c.ResponsabileDashboard),
        data: { breadcrumb: 'Area Responsabile' }
    },
        {
        path: 'convivenze/storico',
        loadComponent: () => import('./convivenze/storico-convivenze').then((c) => c.StoricoConvivenze),
        data: { breadcrumb: 'Storico convivenze' }
    },
        {
        path: 'convivenze',
        component: Convivenze,
        data: { breadcrumb: 'Convivenze' }
    },
        {
        path: 'richieste-strutture/nuova',
        loadComponent: () => import('./richieste-strutture/richieste-strutture').then((c) => c.RichiesteStrutture),
        data: { breadcrumb: 'Nuova richiesta struttura' }
    },
        {
        path: 'richieste-strutture',
        loadComponent: () => import('./richieste-strutture/richieste-strutture').then((c) => c.RichiesteStrutture),
        data: { breadcrumb: 'Richieste strutture' }
    },
        {
        path: 'check-in/:convivenzaId',
        loadComponent: () => import('./check-in/check-in-convivenza').then((c) => c.CheckInConvivenza),
        data: { breadcrumb: 'Check-in convivenza' }
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
