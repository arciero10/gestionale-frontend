# Dati comunitari, compleanni e notifiche mobile

## Regola corrente

All'interno della comunita autenticata telefono, email, coniuge e compleanno
sono dati comunitari visibili se presenti, anche per Person senza User.
Non richiedono un toggle personale. L'accesso resta esclusivamente scoped
alla membership attiva del lettore. Admin onboarding non ha accesso globale.
Ruolo e permessi operativi continuano a controllare le modifiche, non questi
contenuti in lettura. Dati sanitari, note riservate e storico matrimoniale
non sono inclusi nei DTO.

ShowPhone, ShowEmail, ShowFamily e ShowBirthday sono LEGACY/DEPRECATED come
filtri di visibilita comunitaria. Le colonne e il contratto legacy restano
per compatibilita; nessuna nuova migration o cancellazione in questa fase.
La precedente migration AddBirthdayVisibility e gia applicata al DB TEST.

ShowBirthDate continua a controllare l'esposizione della data completa
(anno incluso), salvo la lettura dei propri dati. ShowPhoto resta distinto.
Il nuovo member.birthdayLabel contiene solo giorno/mese indipendentemente
dal consenso legacy alla data completa; non aggiunge colonne al DB.

## API e calendario

GET /api/mobile/birthdays include tutti i CommunityMember attivi della
comunita corrente con BirthDate presente. Non filtra per User, ShowBirthday,
ShowBirthDate o preferenze notifiche.
Risposta con communityName/parishName, today Europe/Rome e compleanni con
personId/memberId, nome, foto se consentita, giorno/mese, label italiana,
daysUntilBirthday, isToday, section e route sicura verso la scheda.
Mai anno di nascita, eta, contatti o note nel calendario.

Ordinamento per prossima occorrenza e nome. Sezioni disgiunte: oggi,
prossimi 7 giorni, resto del mese corrente, prossimamente.
Il 29 febbraio viene celebrato il 28 negli anni non bisestili; il testo
mantiene il compleanno reale. Europe/Rome e autoritativo, anche a Honolulu.
Le API applicano Cache-Control no-store; nessuna cache personale localStorage.

## Scheda e contatti

/mobile/community/member/:id mostra nome, ruolo, tappa, compleanno giorno/mese,
telefono, email, coniuge attivo della stessa comunita e stato account.
Un membro non ancora registrato e immediatamente consultabile.
Dati assenti: Non disponibile. Non si usa Non condiviso per questi campi.
La modifica richiede i permessi backend esistenti; le regole Marriage restano.
La data completa non e esposta automaticamente per rendere pubblico il compleanno.

Chiama usa tel: con numero E.164; Email usa mailto:; WhatsApp usa wa.me
con cifre internazionali. libphonenumber-js normalizza prefissi espliciti
internazionali, 00 e numeri nazionali italiani (regione di default IT),
preservando anche lo zero dei fissi italiani. Nessuna deduzione di un paese
estero da un numero nazionale senza prefisso. Numeri non validi restano
leggibili ma non generano link di chiamata/WhatsApp potenzialmente sbagliati.

## Preferenze notifiche

Profilo e scheda personale collegano a Preferenze notifiche (/mobile/privacy,
route mantenuta per compatibilita). Solo due opzioni:
ReceiveCommunityNotifications e ReceiveBirthdayNotifications.
Nessun toggle di visibilita e nessun input URL foto tecnico.
Upload/Cambia foto sono futuri, non un campo URL da compilare.
La UI preserva gli altri valori del payload legacy al salvataggio.

Le preferenze controllano SOLO la consegna notifiche.
Compleanni e contenuti restano consultabili con entrambe le opzioni OFF.
Un futuro avviso pubblicato dal Responsabile sara leggibile da tutti i
membri della comunita; soltanto i destinatari opt-in riceveranno la push.
Il modulo Avvisi attuale e ancora un placeholder: il test UI verifica
accesso alla sezione con notifiche OFF, non lettura di record pubblicati
da un endpoint avvisi che ancora non esiste.

## Dominio e futuro trasporto

BirthdayNotificationService produce il piano dei compleanni di oggi,
compresi i festeggiati senza account. I destinatari sono invece User
Microsoft attivi con membership corrente e ReceiveBirthdayNotifications=true.
I festeggiati sono esclusi dai destinatari dell'aggregato. Messaggio con
soli nomi, senza anno, eta, contatti o note. Nessun piano se non ci sono eventi.
Le preferenze del festeggiato non sopprimono l'evento comunitario.

Non ci sono push reali, job schedulati o inbox persistente in questa fase.
Il futuro trasporto FCM/APNs deve essere separato dal dominio, con token
dispositivi autenticati, opt-in OS, rotazione/revoca, scheduler Europe/Rome,
deduplicazione e rivalidazione delle preferenze al momento dell'invio.
Chiavi e certificati in secret store, mai nei sorgenti.

## Schema, sicurezza e test

Zero migration per questo riallineamento. Nessun cambio a login/Native Auth.
CommunityId deriva dal JWT e dal DB, non da un valore del client.
Telefono/email/coniuge/compleanno non vengono restituiti fuori contesto.

Tests/Identity usa JWT locali ed EF InMemory: controlli dati comunitari,
membri senza User, flag legacy ignorati, scoping, anno completo protetto,
notifiche opt-in e algoritmo compleanni. Non e un test PostgreSQL remoto.
dotnet test non scopre suite nel progetto API: il runner effettivo e
dotnet run --project Tests/Identity/IdentityChecks.csproj.
Playwright production verifica schede, Emmanuel senza account (fixture),
azioni di contatto, due sole preferenze, contenuti accessibili con opzioni OFF,
timezone e responsive. I dati fixture non modificano i dati reali del DB.
Su Windows il sync iOS non e una build Xcode; serve prova su device reale.

Verifiche del riallineamento: 168 controlli Identity passati, snapshot EF
invariato, build .NET e Angular riuscite con warning non bloccanti.
24 test auth e suite UI production passati in Europe/Rome e Pacific/Honolulu.
Sync Android/iOS e assembleDebug finale con JDK 21 riusciti.
Nessun aggiornamento DB remoto, nuova migration o prova Xcode/dispositivo fisico.
