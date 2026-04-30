import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { FAQ_MOCK, FaqItem, FaqVisibilita } from '../gestionaleCN/data/faq.mock';

@Component({
    selector: 'app-faq',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, InputTextModule, SelectModule, TagModule],
    template: `
        <main class="faq-page" [class.internal]="visibilita === 'interna'">
            <section class="faq-shell">
                <header class="faq-head">
                    <div>
                        <p-tag [value]="visibilita === 'pubblica' ? 'FAQ pubbliche' : 'FAQ interne'" severity="info" />
                        <h1>{{ visibilita === 'pubblica' ? 'Domande frequenti' : 'Aiuto / FAQ operative' }}</h1>
                        <p>{{ intro }}</p>
                    </div>
                    @if (visibilita === 'pubblica') {
                        <a routerLink="/" class="nav-link">Torna alla login</a>
                    }
                </header>

                <section class="faq-tools">
                    <input pInputText placeholder="Cerca per domanda, risposta o tag" [(ngModel)]="ricerca" />
                    <p-select [options]="categorie" [(ngModel)]="categoria" placeholder="Categoria" [showClear]="true"></p-select>
                </section>

                @if (visibilita === 'pubblica') {
                    <p class="notice">Le informazioni presenti in questa sezione sono indicative. La gestione privacy definitiva dovrà essere validata prima della produzione.</p>
                }

                @if (visibilita === 'interna') {
                    <p class="notice">Il gestionale aiuta a tracciare lo stato dei consensi. Prima della produzione sarà necessario validare informativa privacy, modalità di raccolta consenso e ruoli autorizzativi.</p>
                }

                <section class="faq-list">
                    @for (faq of faqFiltrate(); track faq.id) {
                        <details>
                            <summary>
                                <span>{{ faq.domanda }}</span>
                                <p-tag [value]="faq.categoria" severity="secondary" />
                            </summary>
                            <p>{{ faq.risposta }}</p>
                        </details>
                    } @empty {
                        <div class="empty">Nessuna FAQ trovata con questi filtri.</div>
                    }
                </section>
            </section>

            <footer>
                <span>© All rights reserved. Progettato da PANTELEIA - Associazione Promozione Sociale. CF: 96647400587</span>
                <span>Iscrizione RUNTS: Rep. n. 165890 – Det. n. G03684 del 19/03/2026</span>
            </footer>
        </main>
    `,
    styles: [
        `
            .faq-page {
                min-height: 100vh;
                background: #f5f7fb;
                padding: clamp(1rem, 3vw, 2rem);
                display: grid;
                gap: 1rem;
                align-content: start;
            }
            .faq-page.internal {
                min-height: auto;
                padding: 0;
                background: transparent;
            }
            .faq-shell {
                background: #fff;
                border: 1px solid #e4e8ef;
                border-radius: 16px;
                box-shadow: 0 14px 30px rgba(15, 23, 42, .07);
                padding: clamp(1rem, 3vw, 1.5rem);
            }
            .faq-head {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                align-items: flex-start;
            }
            h1 { margin: .5rem 0 .35rem; color: #111827; font-size: clamp(2rem, 5vw, 3rem); }
            .faq-head p,
            .notice,
            details p { color: #64748b; line-height: 1.55; }
            .faq-head p { margin: 0; }
            .nav-link {
                color: #17375e;
                font-weight: 800;
                text-decoration: none;
            }
            .faq-tools {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 16rem;
                gap: .75rem;
                margin: 1.25rem 0;
            }
            .notice {
                margin: 0 0 1rem;
                padding: .85rem;
                border-radius: 12px;
                background: #f8fafc;
                border: 1px solid #e4e8ef;
                font-size: .92rem;
            }
            .faq-list {
                display: grid;
                gap: .75rem;
            }
            details {
                border: 1px solid #e4e8ef;
                border-radius: 12px;
                background: #fbfcfe;
                overflow: hidden;
            }
            summary {
                min-height: 52px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                cursor: pointer;
                padding: .9rem 1rem;
                color: #111827;
                font-weight: 800;
            }
            details p {
                margin: 0;
                padding: 0 1rem 1rem;
            }
            .empty {
                padding: 1rem;
                color: #64748b;
                text-align: center;
                border: 1px dashed #cbd5e1;
                border-radius: 12px;
            }
            footer {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: .35rem 1rem;
                color: #6b7280;
                font-size: .75rem;
                text-align: center;
            }
            .internal footer {
                display: none;
            }
            @media (max-width: 760px) {
                .faq-head,
                summary {
                    flex-direction: column;
                    align-items: flex-start;
                }
                .faq-tools {
                    grid-template-columns: 1fr;
                }
            }
        `
    ]
})
export class Faq {
    private readonly route = inject(ActivatedRoute);
    ricerca = '';
    categoria: FaqItem['categoria'] | null = null;

    get visibilita(): FaqVisibilita {
        return this.route.snapshot.data['visibilita'] ?? 'pubblica';
    }

    get intro() {
        return this.visibilita === 'pubblica' ? 'Informazioni essenziali su accesso, demo, dati e consensi.' : 'Risposte operative per l’uso interno del gestionale.';
    }

    get categorie() {
        return [...new Set(FAQ_MOCK.filter((faq) => faq.visibilita === this.visibilita).map((faq) => faq.categoria))];
    }

    faqFiltrate() {
        const testo = this.ricerca.trim().toLowerCase();
        return FAQ_MOCK
            .filter((faq) => faq.visibilita === this.visibilita)
            .filter((faq) => !this.categoria || faq.categoria === this.categoria)
            .filter((faq) => {
                const haystack = `${faq.domanda} ${faq.risposta} ${faq.categoria} ${faq.tag.join(' ')}`.toLowerCase();
                return !testo || haystack.includes(testo);
            })
            .sort((a, b) => a.ordine - b.ordine);
    }
}
