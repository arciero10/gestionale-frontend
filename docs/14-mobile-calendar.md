# Calendario mobile V1

## Modello ibrido e dominio

La sorgente originale (CalendarImport), gli eventi strutturati (CalendarEvent)
e gli incarichi personali (CalendarAssignment) restano separati. Il vecchio
Event e un task con AreaId obbligatorio; EventTaskItem non collega Person.
Non viene modificato ne riutilizzato impropriamente. Community, Person,
membership attive, permesso EDIT_CALENDAR e CommunityActionAudit sono riusati.
Date e ore sono locali Europe/Rome, senza conversione a mezzanotte UTC.

## Percorso utente

Home e la bottom nav esistente aprono il calendario. La vecchia route
/mobile/calendario resta valida; /mobile/calendar e il percorso canonico.
Il Responsabile trova Importa calendario; il Corresponsabile solo con delega
EDIT_CALENDAR. Il fratello non trova strumenti di gestione.

Route aggiunte: /mobile/calendar, /mobile/calendar/:id,
/mobile/calendar/import, /mobile/calendar/import/:id.
Lista mobile: oggi, prossimi sette giorni, resto del mese, prossimamente.
Gli annullati sono separati. Dettaglio con incaricati e Il tuo incarico.
Home mostra prossimo appuntamento e prossimo incarico personale, se esistono.
Loading, errore con riprova e lista vuota non richiedono dati mock.

## Importazione assistita

TEXT: testo originale nel DB, anno di riferimento esplicito, date italiane
numeriche o mese esteso, eventuale ora/intervallo, titolo e righe di nomi.
Righe Note/Luogo diventano descrizione; righe precedenti una data restano
eventi da verificare/escludere. Nessun riconoscimento automatico infallibile.
Date mancanti/non valide non vengono sostituite con la data di oggi.

EXCEL: parser backend ClosedXML 0.105.1; date native e stringhe, intestazioni
riconosciute per significato oppure estrazione prudente per righe. Si conserva
foglio/intervallo di celle e testo sorgente. Massimo 5 MB, 20 fogli, 2000 righe
e 40 colonne per foglio, 500 candidati; limite ZIP espanso 30 MB/5000 elementi.
Le righe ambigue non vengono scartate silenziosamente.

Ogni evento parte non pubblicato e non verificato. Revisione: data, ore,
titolo libero, tipo generale, descrizione, luogo, persone, incarico, note e
giorni promemoria. Si possono escludere righe e rimuovere candidati errati.
Il file/testo non viene modificato dalla revisione dei dati strutturati.

## Match e approvazione

Il backend confronta solo i membri attivi della comunita corrente:
nome completo esatto, oppure nome proprio univoco. Nessun fuzzy match cieco.
MATCHED, AMBIGUOUS e NOT_FOUND sono evidenziati; il responsabile sceglie nel
menu della propria comunita o rimuove il nome. Le coppie separate da e vengono
proposte come candidati distinti, senza dedurre legami familiari.

Salva bozza non pubblica. Approva e pubblica prima salva la revisione, poi
richiede l'approvazione backend: tutte le righe incluse devono avere data,
titolo, conferma e incaricati risolti/attivi. Solo RESPONSIBLE oppure
CO_RESPONSIBLE con EDIT_CALENDAR. Nessuna deroga per admin onboarding.
L'audit conserva oid/tid JWT dell'attore reale; non quelli inviati nel body.
Lettura fratello: solo pubblicati della comunita corrente; sorgenti/import
non sono accessibili. Gli eventi di altre comunita rispondono 404.

Hash unico comunita+sorgente+anno rende idempotente lo stesso import. Un
documento diverso con stessa data, ora e titolo viene segnalato come possibile
duplicato e non pubblicato senza conferma esplicita. Import rifiutati ed eventi
annullati non sono ostacoli alla pubblicazione. Le revisioni usano UpdatedAt
come token di concorrenza; la pubblicazione PostgreSQL e serializzabile.
Modifiche pubblicate e annullamenti sono auditati, senza DELETE. Gli incarichi
precedenti diventano inattivi, mantenendo lo storico.

## Originali e configurazione mancante

ICalendarOriginalStorage e l'astrazione di archivio. Implementazione V1:
Calendar:OriginalsPath (env Calendar__OriginalsPath) deve essere un percorso
assoluto su volume PERSISTENTE privato, fuori dal webroot, con permessi minimi.
Si salva il file originale .xlsx con nome casuale scoped per comunita; nel DB
solo riferimento e filename. Non si salvano byte nel PostgreSQL.
Non sono configurati secret o account Azure Blob. Senza volume persistente
configurato Excel risponde 503 controllato, non finge di conservare il file.
Il testo resta utilizzabile. Su Azure predisporre un volume duraturo oppure
implementare l'adapter Azure Blob con managed identity dietro la stessa
interfaccia. Definire backup, retention, quote e recupero degli eventuali
originali orfani prima del rilascio oltre il TEST.

## Promemoria e futuro

CalendarReminderService calcola PersonId/evento/data/messaggio per incarichi
attivi pubblicati e non annullati con ReminderDaysBefore. Nessuna push, nessun
timer Android, nessun job o promessa di consegna. Il futuro trasporto deve
rivalidare membership, account destinatario e preferenze notifiche al momento
dell'invio, aggiungere scheduler Europe/Rome e deduplicazione FCM/APNs.
PDF/WORD/IMAGE sono sorgenti future: UI non abilitata, nessun OCR o parsing
simulato. In futuro adapter specifici produrranno sempre la stessa bozza.

## API

Tutte protette dalla policy JWT ExternalIdApi, con comunita risolta dal DB.
Base /api/mobile/calendar:
- GET base e GET /:id: pubblicati e dettaglio.
- GET /people: selezione membri attivi, solo gestori.
- GET /imports e GET /imports/:id: elenco e bozza con sorgente.
- POST /imports/text: text e year.
- POST /imports/excel: multipart file e year.
- PUT /imports/:id: revisione eventi e UpdatedAt atteso.
- POST /imports/:id/approve: UpdatedAt della revisione salvata.
- POST /imports/:id/reject: rifiuto.
- PUT /:id: modifica/annullamento evento pubblicato e UpdatedAt atteso.

## Migration e rilascio

20261119203704_AddCommunityCalendar: creazione di CalendarImports,
CalendarEvents, CalendarAssignments. Nessuna modifica a tabelle esistenti.
Indici: UNIQUE CommunityId+SourceHash; CommunityId+Date+IsPublished;
ImportId; CalendarEventId+PersonId; PersonId.
FK: import/evento verso Community RESTRICT; evento verso import RESTRICT;
incarico verso evento CASCADE e verso Person RESTRICT. Nessun endpoint DELETE.
Date/PersonId nullable per candidati irrisolti; ImportId opzionale per eventi
indipendenti dalla sorgente. Identita integer PostgreSQL;
date, time without time zone, timestamp with time zone, uuid, boolean/text.
Nessun default SQL dinamico: stato PARSED, flag false, IsActive true e timestamp
vengono assegnati dal dominio. Nessun seed, nessuna riscrittura dati esistenti.

Migration SOLO CREATA, non applicata ad Azure. Push backend e frontend sospesi
fino alla conferma di schema TEST aggiornato, per rilasciare insieme API e UI.
Comando dalla sessione con connection string gia configurata (mai in chat):

```powershell
dotnet ef database update --project C:\Dev\GestionaleApiClean\Gestionale.csproj --startup-project C:\Dev\GestionaleApiClean\Gestionale.csproj
```

Non avviare Program.cs contro Azure per verifiche locali: l'inizializzatore
Development preesistente puo applicare migration. I test usano EF InMemory.

## Verifiche

Backend: dotnet build; dotnet test (progetto API senza test discovery);
runner reali Tests/Identity e Tests/Calendar con dotnet run.
CalendarChecks copre parsing testo/XLSX, nomi ambigui, scoping, ruoli/delega,
draft invisibili, pubblicazione, incarico personale, audit, idempotenza,
duplicati, rifiuto, annullamento, storico e reminder.
Frontend: npm run test:auth-mobile e npm run test:mobile-welcome contro dist.
Playwright usa fixture SDK/API: Home, lista, dettaglio, import testo, upload
Excel con archivio non configurato, risoluzione nome ambiguo, approvazione,
visibilita strumenti, bottom nav e viewport 320/390/412. Non testa Azure reale.
Compilazione Angular, cap sync android/ios e assembleDebug; Xcode non su Windows.
