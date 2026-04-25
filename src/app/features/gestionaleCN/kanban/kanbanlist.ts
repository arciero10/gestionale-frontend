import { Component, computed, ElementRef, OnInit, input, output, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InplaceModule } from 'primeng/inplace';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { MenuModule } from 'primeng/menu';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MenuItem } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { KanbanCard } from './kanbancard';
import { AreaUI } from '@/models/macro-area';
import { EventCardUI } from '@/models/event';
import { AreaService } from '@/services/area.service';

@Component({
    selector: 'kanban-list',
    standalone: true,
    imports: [CommonModule, InplaceModule, ButtonModule, RippleModule, MenuModule, KanbanCard, FormsModule, InputTextModule, CdkDropList, CdkDrag, TooltipModule],
    template: `
        <div class="flex justify-between items-center w-full">
            <p-inplace>
                <ng-template #display>
                    <span class="text-lg font-semibold">{{ list().title}}</span>
                </ng-template>
                <ng-template #content let-closeCallback="closeCallback">
                    <span class="inline-flex items-center gap-1 h-10">
                        <input type="text" autofocus pInputText [value]="list().title" [(ngModel)]="list().title" class="h-full rounded-r-none!" />
                        <button (click)="closeCallback($event)" pButton icon="pi pi-check" class="rounded-l-none! h-10!"></button>
                    </span>
                </ng-template>
            </p-inplace>
            <div>
                <button pButton pRipple type="button" icon="pi pi-ellipsis-h" class="p-button-rounded p-button-text p-button-secondary" (click)="menu.toggle($event)"></button>
                <p-menu #menu [model]="menuItems" [popup]="true" appendTo="body"></p-menu>
            </div>
        </div>
        @if(list()) {
        <div
            [attr.id]="listDomId()"
            class="flex flex-col gap-8 overflow-y-auto  mt-6 scrollable kanban-list"
            cdkDropList
            [cdkDropListData]="list().cards"
            (cdkDropListDropped)="dropCard($event)"
            (cdkDropListEntered)="insertHeight($event)"
            (cdkDropListExited)="removeHeight($event)"
            #listEl
            style="min-height:2rem"
        >
            @for (card of cards(); track card.id) {
                <kanban-card [card]="card" [listId]="list().id" cdkDrag [cdkDragDisabled]="isMobileDevice" (select)="onCardSelected.emit(card)" (edit)="toggleSidebar($event)"></kanban-card>
            }
        </div>
        }
        <div class="px-6 mb-4 w-full mt-6 flex">
            <button pButton pRipple label="Nuova" icon="pi pi-plus font-semibold" class="py-4 justify-center font-semibold w-full rounded-border" (click)="insertCard()"></button>
        </div>
    `,
    host: {
        class: 'card md:w-100 overflow-hidden shadow-md rounded-border! shrink-0'
    },
    styles: `
        :host ::ng-deep {
            .p-button-label {
                flex: 0;
                white-space: nowrap;
            }

            .scrollable {
                scroll-behavior: smooth;
                max-height: 50vh;
            }
        }

        :host {
            ::-webkit-scrollbar {
                width: 6px;
            }

            ::-webkit-scrollbar-track {
                background: transparent;
            }

            ::-webkit-scrollbar-thumb {
                background-color: var(--p-gray-500);
                border-radius: 20px;
            }
        }

        .cdk-drag-preview {
            box-sizing: border-box;
            border-radius: 4px;
            box-shadow:
                0 5px 5px -3px rgba(0, 0, 0, 0.2),
                0 8px 10px 1px rgba(0, 0, 0, 0.14),
                0 3px 14px 2px rgba(0, 0, 0, 0.12);
        }

        .cdk-drag-placeholder {
            opacity: 0.25;
        }

        .cdk-drag-animating {
            transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
        }
    `
})
export class KanbanList implements OnInit {
    inputEl = viewChild<ElementRef>('inputEl')
    listEl = viewChild<ElementRef>('listEl')

    list = input.required<AreaUI>();
    listDomId = computed(() => {
        const l = this.list();
        return 'kanban-' + (l?.id ?? '');
    });

    cards = computed<EventCardUI[]>(() => this.list().cards ?? []);
    onCardSelected = output<EventCardUI>();
    onSidebarVisible = output<boolean>();

    menuItems: MenuItem[] = [];
    timeout: any = null;

    isMobileDevice: boolean = false;
    areaService = inject(AreaService);
    constructor() { }

    ngOnInit(): void {
        this.isMobileDevice = this.areaService.isMobileDevice();

        this.menuItems = [
            {
                label: 'Opzioni lista',
                items: [
                    { separator: true },
                    {
                        label: 'Pulisci',
                        command: () => {
                            this.onDelete(this.list().id);
                        }
                    }
                ]
            }
        ];

    }

    toggleSidebar(event: boolean) {
        this.onSidebarVisible.emit(event);
    }

    onDelete(id: number) {
        //rimuove tutte le card di una lista
        // this.areaService.deleteCards(id);
    }

    insertCard() {
        // this.areaService.addCard(this.list()!.id);
    }

    dropCard(event: CdkDragDrop<EventCardUI[]>): void {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        }
    }

    focus() {
        this.timeout = setTimeout(() => this.inputEl()?.nativeElement.focus(), 1);
    }
    insertHeight(event: any) {
        event.container.element.nativeElement.style.minHeight = '10rem';
    }

    removeHeight(event: any) {
        event.container.element.nativeElement.style.minHeight = '2rem';
    }
}
