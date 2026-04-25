import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, input, OnDestroy, output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Customer, CustomerService, Representative } from '@/services/customer.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { Router } from '@angular/router';
import { ProfileCreate } from './profile.create';
@Component({
    selector: 'app-profile-list',
    imports: [TableModule, SelectModule, MultiSelectModule, InputIconModule, TagModule, InputTextModule, CommonModule, FormsModule, ButtonModule, RippleModule, IconFieldModule],
    providers: [CustomerService],
    template: ` <div class="card">
        <div class="font-semibold text-xl mb-4">{{ title() }}</div>
        <p-table
            #dt
            [value]="customers1"
            dataKey="id"
            [paginator]="true"
            paginatorDropdownAppendTo="body"
            [rows]="5"
            [showCurrentPageReport]="true"
            responsiveLayout="scroll"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            [rowsPerPageOptions]="[5, 10, 25, 50]"
            [globalFilterFields]="['name', 'date', 'status']"
        >
            <ng-template #caption>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <p-icon-field class="w-full sm:w-80 order-1 sm:order-0">
                        <p-inputicon class="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Cerca" class="w-full" />
                    </p-icon-field>
                    @if (!isCreateConvivenza()) {
                        <button (click)="navigateToCreateUser()" pButton outlined class="w-full sm:w-auto flex-order-0 sm:flex-order-1" icon="pi pi-user-plus" label="Aggiungi nuovo"></button>
                    } @else {
                        <button pButton type="button" icon="pi pi-user-plus" label="Aggiungi ospite" (click)="onAddGuest($event)" class="mt-2"></button>
                    }
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th pSortableColumn="name" class="white-space-nowrap" style="min-width: 20rem">Nominativo <p-sortIcon field="name"></p-sortIcon></th>
                    @if (!isCreateConvivenza()) {
                        <th pSortableColumn="date" class="white-space-nowrap" style="min-width: 10rem">Data di Nascita <p-sortIcon field="date"></p-sortIcon></th>
                    }
                    <th style="min-width: 8rem" pSortableColumn="status" class="white-space-nowrap">Ruolo <p-sortIcon field="status"></p-sortIcon></th>

                    @if (isCreateConvivenza()) {
                        <th style="min-width: 8rem" pSortableColumn="verified" class="white-space-nowrap">Presenza <p-sortIcon field="verified"></p-sortIcon></th>
                    }
                    <th style="min-width: 8rem" class="white-space-nowrap flex justify-center">Azioni</th>
                </tr>
            </ng-template>
            <ng-template #body let-customer>
                <tr>
                    <td>
                        {{ customer.name }}
                    </td>
                    @if (!isCreateConvivenza()) {
                        <td>
                            {{ customer.date | date: 'MM/dd/yyyy' }}
                        </td>
                    }

                    <td>
                        <p-tag [value]="customer.status.toLowerCase()" [severity]="getSeverity(customer.status)" />
                    </td>
                    @if (isCreateConvivenza()) {
                        <td>
                            <span class="flex justify-center items-center">
                                <i
                                    class="pi"
                                    [ngClass]="{
                                        'text-green-500 pi-check-circle': customer.verified,
                                        'text-red-500 pi-times-circle': !customer.verified
                                    }"
                                ></i>
                            </span>
                        </td>
                    }
                    <td class="flex justify-end gap-1">
                        <p-button icon="pi pi-pencil" [text]="true" severity="info" />
                        <p-button icon="pi pi-trash" [text]="true" severity="danger" />
                    </td>
                </tr>
            </ng-template>
            <ng-template #emptymessage>
                <tr>
                    <td colspan="8">No customers found.</td>
                </tr>
            </ng-template>
            <ng-template #loadingbody>
                <tr>
                    <td colspan="8">Loading customers data. Please wait.</td>
                </tr>
            </ng-template>
        </p-table>
    </div>`
})
export class ProfileList {
    title = input<string>('Lista Fratelli di comunitá');
    isCreateConvivenza = input<boolean>(false);
    customers1: Customer[] = [];
    representatives: Representative[] = [];

    activityValues: number[] = [0, 100];

    balanceFrozen: boolean = false;

    loading: boolean = true;
    rowGroupMetadata: any;
    addGuest = output();

    @ViewChild('filter') filter!: ElementRef;
    constructor(
        private customerService: CustomerService,
        private router: Router
    ) {}

    ngOnInit() {
        this.customerService.getCustomersLarge().then((customers) => {
            this.customers1 = customers;
            this.loading = false;

            // @ts-ignore
            this.customers1.forEach((customer) => (customer.date = new Date(customer.date)));
        });

        this.representatives = [
            { name: 'Amy Elsner', image: 'amyelsner.png' },
            { name: 'Anna Fali', image: 'annafali.png' },
            { name: 'Asiya Javayant', image: 'asiyajavayant.png' },
            { name: 'Bernardo Dominic', image: 'bernardodominic.png' },
            { name: 'Elwin Sharvill', image: 'elwinsharvill.png' },
            { name: 'Ioni Bowcher', image: 'ionibowcher.png' },
            { name: 'Ivan Magalhaes', image: 'ivanmagalhaes.png' },
            { name: 'Onyama Limba', image: 'onyamalimba.png' },
            { name: 'Stephen Shaw', image: 'stephenshaw.png' },
            { name: 'XuXue Feng', image: 'xuxuefeng.png' }
        ];
    }

    formatCurrency(value: number) {
        return value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    clear(table: Table) {
        table.clear();
        this.filter.nativeElement.value = '';
    }

    getSeverity(status: string) {
        switch (status) {
            case 'catechista':
                return 'success';

            case 'ostiario':
                return 'warn';

            case 'nessuno':
                return 'info';
            case 'prete':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    navigateToCreateUser() {
        this.router.navigate(['profile/create']);
    }
    onAddGuest(e: Event) {
        e.preventDefault();
        e.stopPropagation(); // evita propagazione al form / mask
        this.addGuest.emit();
    }
}
