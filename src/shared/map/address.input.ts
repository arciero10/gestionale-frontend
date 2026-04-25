import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {  Subject, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';
import { GeocodingService } from '../services/geocoding.service';

@Component({
    standalone: true,
    selector: 'address-input',
    imports: [CommonModule, FormsModule],
    template: `
        <input class="p-inputtext w-full" [(ngModel)]="q" (ngModelChange)="onChange($event)" placeholder="Cerca indirizzo..." />
        @if(results().length){
            <ul class="mt-2 border rounded p-2 space-y-1">
             @for(r of results(); track r.place_id) {
                <li (click)="pick(r)" class="cursor-pointer hover:bg-surface-50 p-1 rounded">
                    {{ r.display_name }}
                </li>
            }
           </ul>    
        }

    `
})
export class AddressInputComponent {
    private svc = inject(GeocodingService);
    private search$ = new Subject<string>();

    q = '';
    results = signal<any[]>([]);

    constructor() {
        this.search$
            .pipe(
                debounceTime(400),
                distinctUntilChanged(),
                switchMap((q) => (q?.length > 2 ? this.svc.forward(q) : ([] as any))),
            )
            .subscribe((arr => this.results.set(arr as any[])));
    }

    onChange(v: string) {
        this.search$.next(v);
    }

    pick(item: any) {
        this.q = item.display_name;
        this.results.set([]);
        const lat = parseFloat(item.lat),
              lon = parseFloat(item.lon);
        // TODO: emetti evento verso il genitore o aggiorna il form
        // this.selected.emit({ lat, lon, display: item.display_name, address: item.address });
    }
}
