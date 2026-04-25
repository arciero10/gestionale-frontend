import { Routes } from "@angular/router";
import { CreaConvivenza } from "./convivenze/crea.convivevenza";
import { CreaViaggio } from "./viaggi/crea.viaggio";


 export default [
         {
        path: 'convivenze/:type',
        loadComponent: () => import('./kanban').then((c) => c.Kanban),
        data: { breadcrumb: 'Convivenze' }
    },
      { path: 'viaggi/:type', component: CreaViaggio, data: { breadcrumb: 'Viaggi' } }
     //     { path: 'empty', component: Empty },
     //     { path: 'invoice', component: Invoice, data: { breadcrumb: 'Invoice' } },
     //     { path: 'aboutus', component: AboutUs },
     //     { path: 'help', component: Help, data: { breadcrumb: 'Help' } },
     //     { path: 'contact', component: ContactUs },
     //     { path: '**', redirectTo: '/notfound' }
 ] as Routes;
