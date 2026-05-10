import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AccessContextOption, ensureAccessContext, getAccessContexts, saveSelectedAccessContext } from '../data/access-context.mock';

@Component({
    selector: 'app-access-context',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <section class="access-context-page">
            <header class="access-context-head">
                <span>Accesso gestionale</span>
                <h1>Come vuoi entrare?</h1>
                <p>Scegli il contesto operativo da usare in questa sessione.</p>
            </header>

            <div class="context-grid">
                @for (context of contexts; track context.id) {
                    <article class="context-card">
                        <div class="context-icon"><i [class]="context.icon"></i></div>
                        <div>
                            <h2>{{ context.label }}</h2>
                            <p>{{ context.description }}</p>
                        </div>
                        <button pButton type="button" label="Entra" icon="pi pi-arrow-right" iconPos="right" (click)="selectContext(context)"></button>
                    </article>
                }
            </div>
        </section>
    `,
    styles: [
        `
            .access-context-page {
                display: grid;
                gap: 1.25rem;
            }

            .access-context-head,
            .context-card {
                border: 1px solid rgba(255, 255, 255, .42);
                border-radius: 16px;
                background: rgba(255, 255, 255, .94);
                box-shadow: 0 16px 40px rgba(15, 23, 42, .14);
                backdrop-filter: blur(10px);
            }

            .access-context-head {
                padding: 1.2rem;
            }

            .access-context-head span {
                color: #475569;
                font-size: .82rem;
                font-weight: 850;
                text-transform: uppercase;
            }

            h1,
            h2 {
                margin: .2rem 0 .35rem;
                color: #0f172a;
            }

            p {
                margin: 0;
                color: #475569;
                line-height: 1.5;
            }

            .context-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 1rem;
            }

            .context-card {
                min-height: 220px;
                padding: 1rem;
                display: grid;
                gap: 1rem;
                align-content: space-between;
            }

            .context-icon {
                width: 3rem;
                height: 3rem;
                border-radius: 14px;
                display: grid;
                place-items: center;
                color: #fff;
                background: #0f3558;
                box-shadow: 0 12px 28px rgba(15, 53, 88, .18);
            }

            .context-icon i {
                font-size: 1.25rem;
            }

            button {
                min-height: 44px;
                justify-content: center;
            }

            @media (max-width: 760px) {
                .context-grid {
                    grid-template-columns: 1fr;
                }
            }
        `
    ]
})
export class AccessContext {
    private readonly router = inject(Router);
    readonly contexts = getAccessContexts();

    constructor() {
        if (this.contexts.length <= 1) {
            const context = ensureAccessContext();
            queueMicrotask(() => this.router.navigateByUrl(context.route, { replaceUrl: true }));
        }
    }

    selectContext(context: AccessContextOption): void {
        saveSelectedAccessContext(context.id);
        this.router.navigateByUrl(context.route, { replaceUrl: true });
    }
}
