import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { filter, map } from 'rxjs';
import { KanbanSidebar } from './kanbansidebar';
import { KanbanList } from './kanbanlist';
import { ProgressBarModule } from 'primeng/progressbar';
import { AppMap } from '../../../../shared/map/app.map';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { AreaService } from '@/services/area.service';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { EventCardUI } from '@/models/event';

@Component({
    selector: 'kanban',
    standalone: true,
    imports: [CommonModule, CheckboxModule, FormsModule, KanbanSidebar, AppMap, ProgressBarModule, KanbanList, CommonModule, ButtonModule, RippleModule, DragDropModule],
    template: `
    @if (areas.hasValue()) {
           <div class="grid grid-cols-12 gap-6">
            <!-- SINISTRA: liste Kanban -->
            <div class="col-span-12 lg:col-span-4">
                <div class="flex gap-8 w-full flex-col md:flex-row flex-nowrap lg:overflow-y-hidden overflow-x-auto">

            <kanban-list [list]="areas.value()[0]" class="p-kanban-list" (onCardSelected)="onCardSelected($event)" (onSidebarVisible)="toggleSidebar($event)"></kanban-list>
                    @if(selectedCard()) {
                    <kanban-sidebar [visible]="sidebarVisible()" [card]="selectedCard()!" (sidebarVisible)="toggleSidebar($event)"></kanban-sidebar>}
                </div>
            </div>

            <!-- DESTRA: Riepilogo card selezionata -->
            <aside class="col-span-12 lg:col-span-8 lg:sticky lg:top-4">
                @if(selectedCard()) {
                <ng-container>
                    <div class="card p-4 space-y-3 border border-surface rounded-border">
                        <div class="flex justify-between items-center">
                            <span class="text-surface-900 dark:text-surface-0 font-semibold">{{ selectedCard()!.title ? selectedCard()!.title : 'Untitled' }}</span>
                        </div>
                        <div style="word-break: break-word" class="text-surface-700 dark:text-surface-100"><i class="pi pi-users text-surface-700 dark:text-surface-100 mr-2"></i> <strong>Partecipanti: </strong>{{ selectedCard()!.attachments }}</div>
                        @if (selectedCard()!.startDate && selectedCard()!.dueDate) {
                            <div style="word-break: break-word" class="text-surface-700 dark:text-surface-100">
                                <i class="pi pi-clock text-surface-700 dark:text-surface-100 mr-2"></i><strong>Durata: </strong>Data Inizio {{ selectedCard()!.startDate | date: 'dd-MM-yy' }} - DataFine: {{ selectedCard()!.startDate | date: 'dd-MM-yy' }}
                            </div>
                        }
                        @if (selectedCard()!.description) {
                            <div style="word-break: break-word" class="text-surface-700 dark:text-surface-100"><i class="pi pi-map-marker text-surface-700 dark:text-surface-100 mr-2"></i><strong>Luogo: </strong>{{ selectedCard()!.description }}</div>
                            <app-map [coords]="[41.72889, 12.65827]" [zoom]="17" [tooltip]="'Via Rufelli 14,<br/>00041 Albano Laziale RM'"></app-map>
                        }
                        @if (selectedCard()?.taskList && selectedCard()!.taskList?.tasks?.length) {
                            <div class="col-span-12 flex flex-col mt-4">
                                <label for="start" class="block text-surface-900 dark:text-surface-0 font-semibold text-lg mb-2">Promemoria da completare</label>
                                    <ul class="list-none p-6 flex flex-col gap-4 bg-surface-50 dark:bg-surface-950 border-surface border rounded-border">
                                        @for (task of selectedCard()!.taskList!.tasks; track task.text; let i = $index) {
                                            <li class="flex items-center gap-4">
                                                <p-checkbox [name]="task.text + i" [(ngModel)]="task.completed" [binary]="true" [inputId]="task.text"></p-checkbox>
                                                <span style="word-break: break-all;" [ngClass]="{ 'text-600 line-through': task.completed, 'text-900': !task.completed }">
                                                    {{ task.text }}
                                                </span>
                                            </li>
                                        }
                                    </ul>
                            </div>
                        }
                    </div>
                </ng-container>
                    }
                <ng-template #emptyPreview>
                    <div class="card p-4 text-sm text-color-secondary">Nessuna card selezionata.</div>
                </ng-template>
            </aside>
        </div>
    } @else if (areas.isLoading()) {
      Caricamento…
    } @else if (areas.error()) {
      Errore!
    }

    `,
})
export class Kanban{

    private route = inject(ActivatedRoute);
    private areaService = inject(AreaService);

    // Param "type" dalla rotta → Signal<number>
    readonly type = toSignal(
        this.route.paramMap.pipe(
            map(pm => Number(pm.get('type'))),
            filter((n): n is number => !Number.isNaN(n))
        ),
        { initialValue: 1 }
    );

    readonly areas = this.areaService.getAreaByType(this.type);

    vm = computed(() => this.areas.hasValue() ? this.areas.value()[0] : null);

    sidebarVisible = signal<boolean>(false);
    selectedCard = signal<EventCardUI | null>(null);
    private initialCardSelected = false;

    constructor() {
        effect(() => {
            if (this.vm() && !this.initialCardSelected) {
                const firstArea = this.vm();

                if (firstArea && firstArea.cards && firstArea.cards.length > 0) {
                    const firstCard = firstArea.cards[0];
                    this.selectedCard.set(firstCard);
                    this.initialCardSelected = true;
                }
            }
        });
    }

    onCardSelected(event: EventCardUI) {
        this.selectedCard.set(event);
    }

    toggleSidebar(event: boolean) {
        this.sidebarVisible.set(event);
    }

}
