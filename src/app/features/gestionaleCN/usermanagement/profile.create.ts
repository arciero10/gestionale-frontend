import { Component, inject, input, model, Optional, output, signal } from '@angular/core';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonCreate, Service } from '@/models/person';
import { ParishService } from '@/services/parish.service';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputMaskModule } from 'primeng/inputmask';
import { DatePickerModule } from 'primeng/datepicker';
@Component({
    selector: 'user-create',
    standalone: true,
    imports: [CommonModule, FormsModule, Select, InputText, TextareaModule, ButtonModule, RippleModule, CheckboxModule, InputNumberModule, InputMaskModule, DatePickerModule],
    template: `<div class="card">
         <form (ngSubmit)="onSave($event)" class="grid grid-cols-12 gap-4">
            <div class="col-span-12 lg:col-span-12">
                <div class="grid grid-cols-12 gap-2">
                    <div class="mb-4 col-span-4">
                        <label for="firstName" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Nome </label>
                        <input id="firstName" type="text" pInputText fluid [(ngModel)]="model.firstName" name="firstName" />
                    </div>
                    <div class="mb-4 col-span-4">
                        <label for="lastName" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Cognome </label>
                        <input id="lastName" type="text" pInputText fluid [(ngModel)]="model.lastName" name="lastName" />
                    </div>
                      <div class="mb-4 col-span-4">
                        <label for="birthDate" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Data di Nascita </label>
                         <p-datepicker [(ngModel)]="model.birthDate" dateFormat="dd/mm/yy" fluid [showIcon]="true" inputId="birthDate" name="birthDate" [showOnFocus]="false" />
                    </div>
                    <div class="mb-4 col-span-6 md:col-span-6">
                        <label for="email" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Email </label>
                        <input id="email" type="text" pInputText fluid [(ngModel)]="model.email" name="email" />
                    </div>
                    <div class="mb-4 col-span-6 md:col-span-6">
                        <label for="phoneNumber" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Telefono </label>
                         <p-inputmask mask="999-9999999" [(ngModel)]="model.phoneNumber" fluid name="phoneNumber" inputId="phoneNumber" placeholder="Inserisci il numero di telefono" />
                    </div>
                    <div class="mb-4 col-span-12 md:col-span-6">
                        <label for="address" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Indirizzo</label>
                        <input id="address" type="text" pInputText fluid [(ngModel)]="model.address" name="address" />
                    </div>
                    <div class="mb-4 col-span-12 md:col-span-6">
                        <label for="city" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Citta' </label>
                        <input id="city" type="text" pInputText fluid [(ngModel)]="model.city" name="city" />
                    </div>
                    <div class="mb-4 col-span-12 md:col-span-6">
                        <label for="parishId" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Parrocchia </label>
                        <p-select [(ngModel)]="model.parishId" inputId="parishId" [options]="parishes" optionLabel="name" optionValue="id" name="parishId" fluid [filter]="true" filterBy="name" [showClear]="true" placeholder="Seleziona la Parrocchia">
                            <ng-template let-parish #item>
                                <div class="flex items-center">
                                    <div>{{ parish.name }}</div>
                                </div>
                            </ng-template>
                        </p-select>
                    </div>
                    <div class="mb-4 col-span-6 md:col-span-6">
                        <label for="amount" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block">Numero Comunità</label>
                        <p-inputnumber [(ngModel)]="model.communityNumber" inputId="communityNumber" name="communityNumber" fluid [showButtons]="true" buttonLayout="horizontal" inputId="amount" spinnerMode="horizontal" [step]="1"/>
                    </div>
                    <div class="mb-4 col-span-12 md:col-span-6">
                        <label for="service" class="font-medium text-surface-900 dark:text-surface-0 mb-2 block"> Ruolo </label>
                        <p-select [(ngModel)]="model.service"appendTo="body" inputId="service" [options]="roles" optionLabel="name" optionValue="value" name="service" fluid [filter]="true" filterBy="name" [showClear]="true" placeholder="Seleziona ruolo">
                            <ng-template let-role #item>
                                <div class="flex items-center">
                                    <div>{{ role.name }}</div>
                                </div>
                            </ng-template>
                        </p-select>
                    </div>
                    <div class="mb-4 col-span-12 md:col-span-6">
                        <label class="font-medium text-surface-900 dark:text-surface-0 mt-2 mb-2 block">Disabilita'</label>
                        <div class="flex items-center gap-2">
                            <p-checkbox inputId="disability" name="disability" fluid [(ngModel)]="model.disability" [binary]="true"> </p-checkbox>
                            <label for="disability">E' presente una disabilita'</label>
                        </div>
                    </div>
                    <div class="col-span-12 flex gap-2 justify-end">
                        <button pButton type="button" class="p-button-outlined" label="Annulla" (click)="onCancel()"></button>
                        <button pButton type="submit" class="p-button-primary" [label]="buttonLabel()" icon="pi pi-check"></button>
                    </div>
                </div>
            </div>
        </form>
    </div> `
})
export class ProfileCreate {
    initialData = input<PersonCreate>(this.emptyPerson());
    buttonLabel = input<string>('create');
    savedProfile = output<any>();
    roles: any[] = [];

    parishService = inject(ParishService);
    parishes = this.parishService.parishes();
    model: PersonCreate = this.emptyPerson()

    constructor(
        @Optional() public ref?: DynamicDialogRef
    ) { }
    ngOnInit() {

        this.model = { ...this.initialData() };
        this.roles = [
            { name: 'Ostiario', value: Service.Ostiario },
            { name: 'Prete', value: Service.Prete },
            { name: 'Catechista', value: Service.Catechista },
            { name: 'Ospite', value: Service.Ospite },
            { name: 'Fratello', value: Service.Fratello },
            { name: 'Cantore', value: Service.Cantore },
            { name: 'Aiuto ostiario', value: Service.AiutoOstiario }
        ];
    }

    onSave(e: Event) {
        e.preventDefault();
        const result = { ...this.model };
        let mode: string = 'create';
        if(this.model.id !== undefined && this.model.id !== null && this.model.id > 0){ 
            mode = 'update';
        }

        // caso 1: siamo in un DynamicDialog ⇒ chiudi restituendo i dati
        if (this.ref) {       
            this.ref.close({ mode, data: result });
            return;
        }

        // caso 2: usato via router ⇒ emetti evento o naviga
        this.savedProfile.emit({ mode, data: result });
        // esempio di navigazione dopo salvataggio:
        // this.router.navigate(['/profili']);
    }

    onCancel() {
        if (this.ref) this.ref.close(null);
        // via router: puoi navigare indietro, se vuoi
        // else this.router.navigate(['../']);
    }

    private emptyPerson(): PersonCreate {
        return {
            firstName: '',
            lastName: '',
            email: '',
            address: null,
            city: null,
            region: null,
            phoneNumber: null,
            postalCode: null,
            country: null,
            birthDate: null,
            notes: null,
            service: Service.None,
            createdAt: null,
            disability: null,
            parishId: null,
            communityNumber: null
        };
    }
}
