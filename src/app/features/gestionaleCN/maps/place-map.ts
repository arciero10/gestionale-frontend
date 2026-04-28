import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { maps } from './maps.config';

@Component({
    selector: 'app-place-map',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <section class="place-map">
            @if (embedUrl) {
                <iframe [src]="embedUrl" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mappa luogo"></iframe>
            } @else {
                <div class="map-placeholder">
                    <i class="pi pi-map-marker"></i>
                    <h3>{{ nome || 'Luogo da completare' }}</h3>
                    <strong>{{ indirizzo || 'Indirizzo da completare' }}</strong>
                    <span>{{ luogo }}</span>
                    @if (googleMapsUrl) {
                        <a pButton [href]="googleMapsUrl" target="_blank" rel="noopener" icon="pi pi-external-link" label="Apri in Google Maps"></a>
                    }
                    <small>Google Maps integrato in fase successiva.</small>
                </div>
            }
        </section>
    `,
    styles: [
        `
            .place-map { width: 100%; }
            iframe,
            .map-placeholder {
                width: 100%;
                min-height: 320px;
                border-radius: 14px;
                border: 1px solid #e5e7eb;
                overflow: hidden;
            }
            iframe { display: block; }
            .map-placeholder {
                background:
                    linear-gradient(135deg, rgba(248, 250, 252, .96), rgba(239, 246, 255, .92)),
                    repeating-linear-gradient(45deg, rgba(148, 163, 184, .12) 0 1px, transparent 1px 16px);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: .55rem;
                padding: 1.5rem;
                text-align: center;
                color: #334155;
            }
            .map-placeholder .pi {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 3rem;
                height: 3rem;
                border-radius: 999px;
                background: #fff7ed;
                color: #b86f35;
                font-size: 1.45rem;
            }
            .map-placeholder h3 { margin: .25rem 0 0; color: #111827; }
            .map-placeholder strong { color: #334155; }
            .map-placeholder span,
            .map-placeholder small { color: #64748b; }
            .map-placeholder a { margin-top: .45rem; min-height: 44px; }
            @media (max-width: 767px) {
                iframe,
                .map-placeholder { min-height: 240px; }
            }
        `
    ]
})
export class PlaceMapComponent {
    private readonly sanitizer = inject(DomSanitizer);

    @Input() nome = '';
    @Input() indirizzo = '';
    @Input() citta = '';
    @Input() regione = '';
    @Input() latitudine: number | null = null;
    @Input() longitudine: number | null = null;
    @Input() googleMapsUrl = '';

    get luogo() {
        return [this.citta, this.regione].filter(Boolean).join(', ') || 'Localita da completare';
    }

    get embedUrl(): SafeResourceUrl | null {
        if (maps.provider !== 'google' || !maps.googleMapsEmbedApiKey) {
            return null;
        }

        const query = this.latitudine != null && this.longitudine != null ? `${this.latitudine},${this.longitudine}` : [this.nome, this.indirizzo, this.citta, this.regione].filter(Boolean).join(', ');
        const url = `https://www.google.com/maps/embed/v1/place?key=${maps.googleMapsEmbedApiKey}&q=${encodeURIComponent(query)}`;
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
