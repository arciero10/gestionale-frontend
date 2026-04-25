import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ProfileList } from "../usermanagement/profile.list";
import { LayoutService } from "@/layout/service/layout.service";
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-crea-convivenza',
    imports: [CommonModule, ButtonModule, ProfileList],
    template: `
        <h1 class="text-3xl font-bold mb-6">1 Comunita Martiri Canadesi</h1>
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12 xl:col-span-8">
                <div class="card p-6">
                    <app-profile-list [isCreateConvivenza]="true"></app-profile-list>
                </div>
            </div>
            <div class="flex flex-col col-span-12 xl:col-span-4 gap-4">
                <div class="col-span-12">
                    <p-button styleClass="w-full bg-surface-0! dark:bg-surface-900! flex! flex-wrap! justify-start! border-surface! text-primary! p-4!">
                        <div
                            class="w-12 h-12 p-4 flex justify-center items-center rounded-full bg-primary-50 text-primary mr-2"
                            [ngClass]="{
                                'bg-primary-900': layoutService.layoutConfig().colorScheme === 'dark'
                            }"
                        >
                            <i class="pi pi-user-plus text-xl"></i>
                        </div>

                        <div class="flex flex-col items-start text-surface-900 dark:text-surface-0">
                            <span class="block h-auto font-bold">Partecipante</span>
                            <span class="block h-auto">Aggiungi</span>
                        </div>
                    </p-button>
                </div>
                <div class="col-span-12">
                    <p-button styleClass="w-full bg-surface-0! dark:bg-surface-900! flex! flex-wrap! justify-start! border-surface! text-primary! p-4!">
                        <div
                            class="w-12 h-12 p-4 flex justify-center items-center rounded-full bg-primary-50 text-primary mr-2"
                            [ngClass]="{
                                'bg-primary-900': layoutService.layoutConfig().colorScheme === 'dark'
                            }"
                        >
                            <i class="pi pi-user-plus text-xl"></i>
                        </div>

                        <div class="flex flex-col items-start text-surface-900 dark:text-surface-0">
                            <span class="block h-auto font-bold">Struttura</span>
                            <span class="block h-auto">Aggiungi</span>
                        </div>
                    </p-button>
                </div>
            </div>
        </div>
    `
})
export class CreaConvivenza {
    layoutService = inject(LayoutService);
}