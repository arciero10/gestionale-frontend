import { Component, effect, ElementRef, input, untracked, viewChild } from '@angular/core';
import L from 'leaflet';

@Component({
    selector: 'app-map',
    template: ` <div id="map" #map></div> `,
    styles: `
        #map {
            height: 300px;
        }
    `
})
export class AppMap {
    mapReference = viewChild.required<ElementRef>('map');
    coords = input.required<[number, number]>();
    zoom = input(19);
    map: L.Map | null = null;
    marker: L.Marker | null = null;
    tooltip = input<string>('');

    constructor() {
        effect(() => {
            this.map = L.map(this.mapReference().nativeElement, { zoomControl: true }).setView(untracked(this.coords), untracked(this.zoom));

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: this.zoom(),
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(this.map);

            const icon = L.icon({
                iconUrl: '/demo/images/flag/marker-icon.png',
                popupAnchor: [13, 0]
            });

            this.marker = L.marker(this.coords(), { icon }).bindPopup('Angular Leaflet');
            this.marker.addTo(this.map);

            if (this.tooltip()) {
                this.marker.bindTooltip(this.tooltip(), { direction: 'top' }).openTooltip();
            }
            window.dispatchEvent(new Event('resize'));
        });

        effect(() => {
            if (!this.map) {
                return;
            }
            this.map.setView(this.coords());
        });

        effect(() => {
            if (!this.map) {
                return;
            }
            this.map.setZoom(this.zoom());
        });
    }
}