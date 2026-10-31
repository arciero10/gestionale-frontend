import { Component, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mobile-welcome',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mobile-welcome.html',
  styleUrl: './mobile-welcome.scss'
})
export class MobileWelcome implements OnInit, OnDestroy {
  @Output() readonly access = new EventEmitter<void>();
  @Output() readonly registration = new EventEmitter<void>();
  private readonly document = inject(DOCUMENT);
  private viewport: HTMLMetaElement | null = null;
  private originalViewport: string | null = null;

  ngOnInit(): void {
    // This component exists only on native: leave browser viewport settings intact.
    this.viewport = this.document.querySelector('meta[name="viewport"]');
    this.originalViewport = this.viewport?.getAttribute('content') ?? null;
    if (this.viewport && !this.originalViewport?.includes('viewport-fit='))
      this.viewport.setAttribute('content', `${this.originalViewport ?? 'width=device-width, initial-scale=1.0'}, viewport-fit=cover`);
  }

  ngOnDestroy(): void {
    if (this.viewport && this.originalViewport !== null)
      this.viewport.setAttribute('content', this.originalViewport);
  }
}
