import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommunityApiService, MemberPrivacy } from '../../services/community-api.service';

@Component({
  selector: 'app-mobile-privacy', standalone: true, imports: [RouterLink, FormsModule], styleUrl: './mobile-community.scss',
  template: `
    <a class="back" routerLink="/mobile/profilo"><i class="pi pi-arrow-left" aria-hidden="true"></i> Profilo</a><h1>Preferenze notifiche</h1>
    @if (loading) { <div class="skeleton" role="status" aria-label="Caricamento preferenze"></div> }
    @else if (preferences) {
      <section class="privacy"><form (ngSubmit)="save()">
        <label class="check"><input type="checkbox" name="communityNotifications" [(ngModel)]="preferences.receiveCommunityNotifications" [disabled]="busy" aria-describedby="community-description" />Ricevi notifiche della comunità</label>
        <small id="community-description">Avvisi, comunicazioni e aggiornamenti pubblicati dai Responsabili.</small>
        <label class="check"><input type="checkbox" name="birthdayNotifications" [(ngModel)]="preferences.receiveBirthdayNotifications" [disabled]="busy" aria-describedby="birthday-description" />Ricevi notifiche sui compleanni</label>
        <small id="birthday-description">Ricevi una notifica quando un fratello della tua comunità compie gli anni.</small>
        <p class="muted">Le preferenze riguardano solo le notifiche, non i contenuti nell'app.</p>
        <p class="muted">Notifiche push non ancora attive.</p>
        <button class="primary" type="submit" [disabled]="busy">{{ busy ? 'Salvataggio...' : 'Salva preferenze' }}</button>
      </form></section>
    }
    @if (error) { <p class="feedback" role="alert">{{ error }}</p><button class="secondary" type="button" [disabled]="busy" (click)="load()">Riprova</button> }
    @if (feedback) { <p class="feedback" role="status">{{ feedback }}</p> }
  `
})
export class MobilePrivacy implements OnInit {
  private readonly api = inject(CommunityApiService);
  protected preferences: MemberPrivacy | null = null;
  protected loading = true;
  protected busy = false;
  protected error = '';
  protected feedback = '';
  ngOnInit(): void { void this.load(); }
  protected async load(): Promise<void> {
    this.loading = true; this.error = ''; this.feedback = ''; this.preferences = null;
    try { this.preferences = await this.api.getPrivacy(); }
    catch { this.error = 'Impossibile caricare le preferenze. Riprova.'; }
    finally { this.loading = false; }
  }
  protected async save(): Promise<void> {
    if (this.busy || !this.preferences) return;
    this.busy = true; this.error = ''; this.feedback = '';
    try { await this.api.savePrivacy(this.preferences); this.preferences = await this.api.getPrivacy(); this.feedback = 'Preferenze salvate.'; }
    catch { this.error = 'Impossibile confermare il salvataggio. Riprova.'; }
    finally { this.busy = false; }
  }
}
