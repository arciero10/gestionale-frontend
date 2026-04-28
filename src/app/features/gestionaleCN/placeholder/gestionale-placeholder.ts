import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-gestionale-placeholder',
    standalone: true,
    template: `
        <section class="card p-6">
            <h1 class="text-3xl font-bold m-0 mb-3 text-surface-900 dark:text-surface-0">{{ title() }}</h1>
            <p class="m-0 text-surface-600 dark:text-surface-300">Modulo in sviluppo.</p>
        </section>
    `
})
export class GestionalePlaceholder {
    private route = inject(ActivatedRoute);
    title = () => this.route.snapshot.data['title'] ?? 'Modulo';
}
