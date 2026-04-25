import { Component, input, output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { EventCardUI } from '@/models/event';
import { AreaService } from '@/services/area.service';

@Component({
    selector: 'kanban-card',
    standalone: true,
    imports: [CommonModule, TieredMenuModule, ButtonModule, RippleModule, AvatarModule, ProgressBarModule, AvatarGroupModule, CdkDragHandle],
    template: `<div
        [attr.id]="'kanban-' + card().id"
        cdkDragHandle (click)="onSelect()"
        class="flex bg-surface-0 dark:bg-surface-900 flex-col w-full border border-surface p-4 gap-2 hover:bg-surface-50 dark:hover:bg-surface-950 cursor-pointer rounded-border"
        cdkDragHandle
    >
        <div class="flex justify-between items-center">
            <span class="text-surface-900 dark:text-surface-0 font-semibold">{{ card().title ? card().title : 'Untitled' }}</span>
            <div>
                <button pButton pRipple type="button" icon="pi pi-pencil" rounded text severity="info" class="p-trigger" (click)="onEdit($event)"></button>
                <button pButton pRipple type="button" icon="pi pi-cog" rounded text severity="secondary" class="p-trigger" (click)="onCog($event, menu)"></button>
                <p-tiered-menu #menu [model]="menuItems" appendTo="body" [popup]="true"></p-tiered-menu>
            </div>
        </div>
        @if (card().description) {
            <div style="word-break: break-word" class="text-surface-700 dark:text-surface-100"><i class="pi pi-map-marker text-surface-700 dark:text-surface-100 mr-2"></i>{{ card().description }}</div>
        }
        <div class="flex items-center justify-between flex-col md:flex-row gap-6 md:gap-0">
            @if (card().attendances) {
                <span class="text-surface-900 dark:text-surface-0 font-semibold"><i class="pi pi-users text-surface-700 dark:text-surface-100 mr-2"></i>{{ card().attendances }}</span>
            }
            @if (card().dueDate) {
                <span class="text-surface-900 dark:text-surface-0 font-semibold"><i class="pi pi-clock text-surface-700 dark:text-surface-100 mr-2"></i>{{ card().dueDate }}</span>
            }
        </div>
    </div>`
})
export class KanbanCard {
    card = input.required<EventCardUI>();
    listId = input.required<number>();
    select = output<EventCardUI>();
    edit = output<boolean>();

    menuItems: MenuItem[] = [];

    constructor() {
        this.menuItems = [
            { label: 'Copia', command: () => this.onCopy() },
            { label: 'Elimina', command: () => this.onDelete() }
        ];
    }

    parseDate(dueDate: string) {
        return new Date(dueDate).toDateString().split(' ').slice(1, 3).join(' ');
    }

    onDelete() {
        //    this.areaService.deleteCard(this.card().id, this.listId());
    }

    onCopy() {
        //    this.areaService.copyCard(this.card(), this.listId());
    }

    onMove(listId: number) {
        //  this.areaService.moveCard(this.card(), listId, this.listId());
    }




    generateTaskInfo() {
        if (this.card().taskList) {
            let total = this.card().taskList!.tasks.length;
            let completed = this.card().taskList!.tasks.filter((t) => t.completed).length;
            return `${completed} / ${total}`;
        }
        else return '';
    }

    onCog(e: Event, menu: any) {
        e.stopPropagation();
        menu.toggle(e);
    }

    onSelect() {
        this.select.emit(this.card());
    }

    onEdit(e: Event) {
        e.stopPropagation();
        this.edit.emit(true);
    }
}
