import { PersonCreate, Service } from './../../models/person';
import { AuthService } from './../../auth/auth.service';
import { Component, computed, inject, OnDestroy } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { RouterLink } from '@angular/router';
import { LayoutService } from '@/layout/service/layout.service';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProfileCreate } from '../gestionaleCN/usermanagement/profile.create';
import { ToastModule } from 'primeng/toast';
import { ParishService } from '@/services/parish.service';
import { PersonService } from '@/services/person.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    ChartModule,
    RouterLink,
    DynamicDialogModule,
    TableModule,
    MenuModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    CommonModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    RippleModule,
    ToastModule
  ],
  providers: [DialogService, MessageService],
  template: `
    <div class="grid grid-cols-12 gap-8">
      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <a
          [routerLink]="['/gestionale-cn/convivenze/1']"
          class="block h-48 rounded-border bg-cyan-400 bg-center bg-cover bg-no-repeat text-white
          transition-transform duration-300 ease-out will-change-transform
          hover:scale-[1.02] hover:shadow-xl active:scale-[0.99] cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2
          dark:focus-visible:ring-offset-gray-900 group"
          style="background-image: url('/demo/images/dashboard/effect-1.svg')"
          aria-label="Convivenze"
        >
          <div class="h-full w-full flex flex-col items-center justify-center text-center">
            <span class="text-2xl font-bold tracking-tight">Convivenze</span>
            <span class="mt-1 text-sm opacity-80 transition-opacity group-hover:opacity-100">
              clicca per iniziare
            </span>
          </div>
        </a>
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <a
          [routerLink]="['/gestionale-cn/viaggi/0']"
          class="block h-48 rounded-border bg-orange-400 bg-center bg-cover bg-no-repeat text-white
          transition-transform duration-300 ease-out will-change-transform
          hover:scale-[1.02] hover:shadow-xl active:scale-[0.99] cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2
          dark:focus-visible:ring-offset-gray-900 group"
          style="background-image: url('/demo/images/dashboard/effect-2.svg')"
          aria-label="Post Cresima - Gmg - Campi Estivi"
        >
          <div class="h-full w-full flex flex-col items-center justify-center text-center">
            <span class="text-2xl font-bold tracking-tight">Post Cresima - Gmg - Campi Estivi</span>
            <span class="mt-1 text-sm opacity-80 transition-opacity group-hover:opacity-100">
              clicca per iniziare
            </span>
          </div>
        </a>
      </div>

      <div class="col-span-12 md:col-span-4 xl:col-span-3">
        <p-toast />

        <p-button
          (click)="openCreateCommunityDialog()"
          styleClass="w-full bg-surface-0! dark:bg-surface-900! flex! flex-wrap! justify-start! h-24 border-surface! text-primary! p-4!"
        >
          <div
            class="w-12 h-12 p-4 flex justify-center items-center rounded-full bg-primary-50 text-primary mr-2 dark:bg-primary-900!"
          >
            <i class="pi pi-plus text-xl"></i>
          </div>

          <div class="flex flex-col items-start text-surface-900 dark:text-surface-0">
            <span class="block h-auto font-bold">{{ buttonPerson() }}</span>
            <span class="block h-auto">{{ buttonPerson() }} il tuo profilo</span>
          </div>
        </p-button>
      </div>

      <div class="col-span-12 md:col-span-4 xl:col-span-3">
        <p-button
          styleClass="w-full bg-surface-0! dark:bg-surface-900! flex! flex-wrap! justify-start! h-24 border-surface! text-primary! p-4!"
        >
          <div
            class="w-12 h-12 p-4 flex justify-center items-center rounded-full bg-primary-50 text-primary mr-2 dark:bg-primary-900!"
          >
            <i class="pi pi-send text-xl"></i>
          </div>

          <div class="flex flex-col items-start text-surface-900 dark:text-surface-0">
            <span class="block h-auto font-bold">Mail</span>
            <span class="block h-auto">Invia Link di Invito</span>
          </div>
        </p-button>
      </div>
    </div>
  `
})
export class Dashboard implements OnDestroy {
  items!: MenuItem[];
  cols: any[] = [];

  ref: DynamicDialogRef<ProfileCreate> | null = null;

  dialogService = inject(DialogService);
  messageService = inject(MessageService);
  layoutService = inject(LayoutService);
  authService = inject(AuthService);
  parishService = inject(ParishService);
  personService = inject(PersonService);

  authenticated = this.authService.isAuthenticated();

  userId = computed(() => this.authService.state().userId);

  readonly personResource = this.personService.getPersonById(this.userId);

  buttonPerson = computed(() => {
    const p = this.personResource?.value();

    if (p?.id != null && p.id > 0) {
      return 'Modifica';
    }

    return 'Crea';
  });

  ngOnInit() {
    this.cols = [
      { header: 'Name', field: 'name' },
      { header: 'Category', field: 'category' },
      { header: 'Price', field: 'price' },
      { header: 'Status', field: 'inventoryStatus' }
    ];
  }

  openCreateCommunityDialog() {
    let person: PersonCreate;
    let mode: string = 'create';

    if (this.personResource?.value()?.id != null && this.personResource.value()!.id > 0) {
      person = this.personResource.value()!;
      person.birthDate = person.birthDate ? new Date(person.birthDate) : null;
      mode = 'update';
    } else {
      person = {
        firstName: this.authService.state().firstName || '',
        lastName: this.authService.state().lastName || '',
        email: this.authService.state().email || '',
        address: null,
        city: null,
        region: null,
        phoneNumber: null,
        postalCode: null,
        country: null,
        birthDate: null,
        notes: null,
        service: Service.None,
        createdAt: new Date(),
        disability: null,
        parishId: null,
        communityNumber: null
      };
    }

    this.ref = this.dialogService.open(ProfileCreate, {
      header: 'Completa il tuo profilo',
      width: '60vw',
      height: 'auto',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      inputValues: {
        initialData: person,
        buttonLabel: mode === 'create' ? 'Crea Profilo' : 'Aggiorna Profilo'
      }
    });

    this.ref?.onClose.subscribe((data) => {
      let summary_and_severity;

      if (data) {
        data.birthDate = data.birthDate ? new Date(data.birthDate) : null;

        if (data.mode === 'create') {
          data.createdAt = new Date();

          this.personService.createProfile(data.data).subscribe({
            next: (response) => {
              console.log('Profile created successfully', response);
              summary_and_severity = {
                severity: 'success',
                summary: 'Utente Registrato',
                detail: data?.name
              };

              this.messageService.add({ ...summary_and_severity, life: 3000 });
            },
            error: (error) => {
              console.error('Error creating profile', error);
              summary_and_severity = {
                severity: 'error',
                summary: 'Registrazione annullata'
              };

              this.messageService.add({ ...summary_and_severity, life: 3000 });
            }
          });
        } else {
          this.personService.updateProfile(data.data).subscribe({
            next: () => {
              console.log('Profile updated successfully');
              summary_and_severity = {
                severity: 'success',
                summary: 'Utente Aggiornato',
                detail: data.data.id
              };

              this.messageService.add({ ...summary_and_severity, life: 3000 });
            },
            error: (error) => {
              console.error('Error updating profile', error);
              summary_and_severity = {
                severity: 'error',
                summary: 'Aggiornamento annullato'
              };

              this.messageService.add({ ...summary_and_severity, life: 3000 });
            }
          });
        }
      } else {
        summary_and_severity = {
          severity: 'warn',
          summary: 'Registrazione annullata'
        };

        this.messageService.add({ ...summary_and_severity, life: 3000 });
      }
    });
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
}