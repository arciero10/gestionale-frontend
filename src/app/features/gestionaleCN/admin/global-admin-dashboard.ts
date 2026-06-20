import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MEMBRI_COMUNITA_PILOTA } from '../data/comunita-pilota.mock';
import { readStruttureSegnalate, SAN_GAETANO_CENSIMENTO_STORAGE_KEY, CensimentoStrutturaMock } from '../../strutture/strutture-censimento.mock';
import { readProfileStatus, readStrutturaProfile } from '../../strutture/struttura-profile.storage';

type GlobalAdminCard = {
    title: string;
    value: number;
    description: string;
    icon: string;
    route: string;
};

@Component({
    selector: 'app-global-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, ButtonModule, TagModule],
    template: `
        <section class="global-admin-page">
            <header class="admin-hero">
                <div>
                    <span>Global Admin</span>
                    <h1>Dashboard amministrazione globale</h1>
                    <p>Controllo completo del gestionale: comunità, profili, strutture, convivenze, richieste e impostazioni principali.</p>
                </div>
                <p-tag value="GLOBAL_ADMIN" severity="contrast"></p-tag>
            </header>

            <section class="admin-grid" aria-label="Riepilogo amministrazione globale">
                @for (card of cards; track card.title) {
                    <article class="admin-card">
                        <div class="card-top">
                            <span class="icon-box"><i [class]="card.icon"></i></span>
                            <strong>{{ card.value }}</strong>
                        </div>
                        <div>
                            <h2>{{ card.title }}</h2>
                            <p>{{ card.description }}</p>
                        </div>
                        <a pButton [routerLink]="card.route" label="Gestisci" icon="pi pi-arrow-right" iconPos="right"></a>
                    </article>
                }
            </section>
        </section>
    `,
    styles: [
        `
            .global-admin-page { display: grid; gap: 1.25rem; color: #0f172a; }
            .admin-hero,
            .admin-card {
                border: 1px solid rgba(226,232,240,.9);
                border-radius: 16px;
                background: rgba(255,255,255,.96);
                box-shadow: 0 16px 40px rgba(15,23,42,.12);
            }
            .admin-hero {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                align-items: flex-start;
                padding: 1.25rem;
            }
            .admin-hero span {
                color: #1d4ed8;
                font-size: .78rem;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: .04em;
            }
            h1,
            h2 { margin: .15rem 0 .35rem; color: #0f172a; }
            h1 { font-size: clamp(1.7rem, 3vw, 2.35rem); }
            h2 { font-size: 1.05rem; }
            p { margin: 0; color: #334155; line-height: 1.55; }
            .admin-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
            .admin-card {
                min-height: 220px;
                display: grid;
                gap: .9rem;
                align-content: space-between;
                padding: 1rem;
            }
            .card-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
            .card-top strong { color: #0f172a; font-size: 2rem; line-height: 1; }
            .icon-box {
                width: 3rem;
                height: 3rem;
                display: grid;
                place-items: center;
                border-radius: 14px;
                color: #fff;
                background: #1d4ed8;
                box-shadow: 0 12px 28px rgba(29,78,216,.22);
            }
            .icon-box i { font-size: 1.25rem; }
            a[pButton] { min-height: 44px; justify-content: center; }
            @media (max-width: 1180px) {
                .admin-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 720px) {
                .admin-hero { flex-direction: column; }
                .admin-grid { grid-template-columns: 1fr; }
            }
        `
    ]
})
export class GlobalAdminDashboard {
    private readonly segnalazioni = readStruttureSegnalate();
    private readonly censimento = this.readCensimentoSanGaetano();
    private readonly strutturaProfile = readStrutturaProfile();
    private readonly profileStatus = readProfileStatus();

    readonly cards: GlobalAdminCard[] = [
        {
            title: 'Comunità registrate',
            value: 1,
            description: 'Diocesi, settori, parrocchie e comunità censite nel gestionale.',
            icon: 'pi pi-sitemap',
            route: '/gestionale-cn/admin/comunita'
        },
        {
            title: 'Profili/fratelli',
            value: MEMBRI_COMUNITA_PILOTA.length,
            description: 'Profili personali, consensi, recapiti e dati comunitari principali.',
            icon: 'pi pi-users',
            route: '/gestionale-cn/admin/profili'
        },
        {
            title: 'Responsabili',
            value: MEMBRI_COMUNITA_PILOTA.filter((membro) => membro.ruolo === 'Responsabile' || membro.ruolo === 'Corresponsabile').length,
            description: 'Responsabili e corresponsabili associati alle comunità.',
            icon: 'pi pi-id-card',
            route: '/gestionale-cn/admin/utenti'
        },
        {
            title: 'Strutture in attesa',
            value: this.struttureInAttesa,
            description: 'Accreditamenti, censimenti o segnalazioni da verificare.',
            icon: 'pi pi-clock',
            route: '/gestionale-cn/admin/strutture'
        },
        {
            title: 'Strutture approvate',
            value: this.struttureApprovate,
            description: 'Strutture abilitate e disponibili nel catalogo operativo.',
            icon: 'pi pi-building',
            route: '/gestionale-cn/admin/strutture'
        },
        {
            title: 'Convivenze attive',
            value: this.countLocalStoragePrefix('bozza-convivenza-'),
            description: 'Convivenze operative e bozze create nel mock locale.',
            icon: 'pi pi-calendar',
            route: '/gestionale-cn/admin/convivenze'
        },
        {
            title: 'Richieste strutture',
            value: this.countLocalStoragePrefix('richiesta-struttura-'),
            description: 'Richieste disponibilità inviate o in lavorazione.',
            icon: 'pi pi-send',
            route: '/gestionale-cn/admin/richieste'
        },
        {
            title: 'Viaggi/pellegrinaggi',
            value: 0,
            description: 'Area viaggi e pellegrinaggi pronta per futura attivazione.',
            icon: 'pi pi-map',
            route: '/gestionale-cn/admin/viaggi'
        }
    ];

    get struttureInAttesa(): number {
        const segnalate = this.segnalazioni.filter((item) => !item.pubblicata && item.stato !== 'Scartata').length;
        const censimentoInAttesa = this.censimento && !this.censimento.pubblicata ? 1 : 0;
        const profiloInAttesa = this.strutturaProfile && this.profileStatus === 'IN_ATTESA' ? 1 : 0;
        return segnalate + censimentoInAttesa + profiloInAttesa;
    }

    get struttureApprovate(): number {
        const censimentoApprovato = this.censimento?.pubblicata ? 1 : 0;
        const profiloApprovato = this.strutturaProfile && this.profileStatus === 'APPROVATA' ? 1 : 0;
        return censimentoApprovato + profiloApprovato;
    }

    private readCensimentoSanGaetano(): CensimentoStrutturaMock | null {
        const raw = localStorage.getItem(SAN_GAETANO_CENSIMENTO_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as CensimentoStrutturaMock;
        } catch {
            return null;
        }
    }

    private countLocalStoragePrefix(prefix: string): number {
        if (typeof localStorage === 'undefined') {
            return 0;
        }

        let count = 0;
        for (let index = 0; index < localStorage.length; index += 1) {
            if (localStorage.key(index)?.startsWith(prefix)) {
                count += 1;
            }
        }
        return count;
    }
}
