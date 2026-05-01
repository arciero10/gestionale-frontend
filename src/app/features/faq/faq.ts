import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { FAQ_MOCK, FaqItem, FaqVisibilita, SUPPORT_EMAIL } from '../gestionaleCN/data/faq.mock';

@Component({
    selector: 'app-faq',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, InputTextModule, SelectModule, TagModule],
    template: `
        <main class="faq-page" [class.internal]="visibilita === 'interna'">
            <section class="faq-shell">
                <header class="faq-head">
                    <div>
                        <p-tag [value]="visibilita === 'pubblica' ? 'FAQ pubbliche' : 'Aiuto / FAQ'" severity="info" />
                        <h1>{{ visibilita === 'pubblica' ? 'Domande frequenti' : 'Aiuto / FAQ' }}</h1>
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

                <section class="support-card">
                    <span>Supporto</span>
                    <h2>Hai bisogno di aiuto?</h2>
                    <p>Scrivi a <a [href]="'mailto:' + supportEmail">{{ supportEmail }}</a> indicando nome e cognome, comunità/parrocchia se già associata, problema riscontrato ed eventuale screenshot.</p>
                </section>

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
                <span>Supporto: {{ supportEmail }}</span>
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
            details p,
            .support-card p { color: #64748b; line-height: 1.55; }
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
            .support-card {
                margin: 0 0 1rem;
                padding: 1rem;
                border-radius: 14px;
                background: #eff6ff;
                border: 1px solid #bfdbfe;
            }
            .support-card span {
                display: block;
                color: #315f8f;
                font-size: .78rem;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: .03em;
            }
            .support-card h2 {
                margin: .25rem 0;
                color: #0f2440;
                font-size: 1.25rem;
            }
            .support-card p { margin: 0; }
            .support-card a {
                color: #17375e;
                font-weight: 900;
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
    readonly supportEmail = SUPPORT_EMAIL;
    ricerca = '';
    categoria: FaqItem['categoria'] | null = null;

    get visibilita(): FaqVisibilita {
        return this.route.snapshot.data['visibilita'] ?? 'pubblica';
    }

    get intro() {
        return 'Informazioni essenziali su accesso, scelta comunità, privacy, convivenze, richieste strutture e supporto.';
    }

    get categorie() {
        return [...new Set(this.faqVisibili().map((faq) => faq.categoria))];
    }

    faqFiltrate() {
        const testo = this.ricerca.trim().toLowerCase();
        return this.faqVisibili()
            .filter((faq) => !this.categoria || faq.categoria === this.categoria)
            .filter((faq) => {
                const haystack = `${faq.domanda} ${faq.risposta} ${faq.categoria} ${faq.tag.join(' ')}`.toLowerCase();
                return !testo || haystack.includes(testo);
            })
            .sort((a, b) => a.ordine - b.ordine);
    }

    private faqVisibili() {
        return FAQ_MOCK.filter((faq) => faq.visibilita === 'pubblica' || faq.visibilita === this.visibilita);
    }
}
