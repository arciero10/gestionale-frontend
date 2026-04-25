import { Routes } from "@angular/router";
import { ProfileCreate } from "./profile.create";
import { ProfileList } from "./profile.list";

export default [
    { path: '', redirectTo: 'profile/list', pathMatch: 'full' },
    { path: 'list', data: { breadcrumb: 'List' }, component: ProfileList },
    { path: 'create', data: { breadcrumb: 'Create' }, component: ProfileCreate }
] as Routes;
