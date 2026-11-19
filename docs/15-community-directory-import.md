# Rubrica comunita e import massivo V1

## Anagrafica unica

Person + CommunityMember sono la rubrica autorevole, anche senza User.
Il parsing non crea mai persone o membership. Le bozze usano
CommunityDirectoryImport e CommunityDirectoryImportRow, secondo il pattern
calendario ma senza accoppiare eventi e persone importate.
Conferma autorizzata: RESPONSIBLE con EDIT_MEMBRI, oppure CO_RESPONSIBLE con
delega EDIT_MEMBRI. Admin onboarding non ha accesso automatico a rubriche altrui.
CommunityId viene sempre risolto dal JWT e dal DB, mai scelto nel payload.
MSAL, Native Authentication, onboarding e login non sono modificati.

## Sorgenti e parsing

V1: TEXT, CSV UTF-8, EXCEL .xlsx. PDF/WORD/IMAGE restano future e non sono
mostrate nella UI. Non viene promesso riconoscimento perfetto.

Testo: righe Nome Cognome - telefono - email, oppure contatti nelle righe
successive al nome. Mancanze e nomi composti richiedono verifica; nessun dato
obbligatorio oltre a nome/cognome. La sorgente integrale resta nella bozza.

CSV: TextFieldParser, delimitatore rilevato fra punto e virgola, virgola e tab;
campi quotati, doppi apici e newline interni sono gestiti dal parser strutturato.
XLSX: ClosedXML gia usato dal calendario, valori data nativi, intestazioni in
ordine diverso e piu fogli. Tutti i fogli sono in bozza e selezionabili; nessun
foglio ambiguo viene pubblicato direttamente. Fogli senza intestazioni chiare
sono candidati da verificare, non nuove persone gia approvate.

Alias: Nome, Cognome, Nome completo/Nominativo, Telefono/Cellulare/Mobile,
Email/Mail, Data nascita/Compleanno, Ruolo/Carisma, Tappa, Coniuge e Note.
Note e supportato dal modello Person, ma resta riservato: mai esposto nella
lista o nella scheda di altri fratelli. Nessun consenso o account viene dedotto.
Date complete riconosciute come data italiana o ISO. Giorno/mese senza anno
non viene trasformato in una data inventata: completarlo oppure escluderlo.
Limiti: 5 MB per file, 20 fogli, 2000 righe e 40 colonne, 500 persone candidate;
XLSX ZIP espanso massimo 30 MB e 5000 elementi. Origine foglio/riga conservata.

## Duplicati e risoluzione

Ricerca solo nei membri della stessa comunita, anche inattivi per evitare di
ricensirli come nuove persone. Inattivi non sono riattivati dall'importazione.
Match su nome+cognome normalizzati, email e telefono. libphonenumber-csharp
normalizza numeri possibili con regione predefinita IT solo per confrontarli;
il numero originale non viene riscritto automaticamente in anagrafica.
Non si importano automaticamente persone di altre comunita, anche se omonime.

Classificazioni: MATCH_EXISTING, POSSIBLE_DUPLICATE, NEW_PERSON.
Stati revisione: PRONTO, DA_VERIFICARE, POSSIBILE_DUPLICATO, ERRORE;
IGNORATA per righe o fogli esclusi. Anche le collisioni interne al file sono
segnalate. Nome+cognome identici non possono creare una seconda persona:
usare quella esistente o unire i dati e ignorare la copia. Contatti condivisi
fra persone realmente distinte richiedono verifica e conferma esplicita.
La conferma ricontrolla i duplicati nel DB, non si fida dello stato frontend.

Ogni riga permette: Crea nuova persona, Usa persona esistente, Ignora riga.
Il semplice riuso non aggiorna i dati. Aggiorna dati e Aggiorna ruolo sono
scelte esplicite, con gli stessi limiti dei permessi membri esistenti.
Campi opzionali vuoti preservano quelli gia censiti; non cancellano contatti.
Note importate aggiunte a quelle riservate solo se si sceglie l'aggiornamento.
Data completa di altri membri non modificabile senza la regola ShowBirthDate
gia applicata dalla scheda. I consensi/notifiche esistenti non sono toccati.
Responsabile/Catechista non vengono assegnati tramite import: serve il percorso
autorizzativo esistente. Corresponsabile delegato importa soltanto MEMBER.

## Coniuge

Indicazione originale e proposta di match mostrate senza creare Marriage.
Un nome ambiguo resta da verificare. La scelta puo riguardare un membro attivo
gia censito o un'altra riga inclusa della stessa bozza; la relazione viene
materializzata solo alla conferma, dopo aver risolto entrambe le Person reali.
Confermo il collegamento coniuge e sempre esplicito. Non applicarlo significa
non dedurre alcun matrimonio dal testo. Coppie reciproche producono una sola
relazione. Self-link, persone esterne, righe ignorate e coppie incoerenti sono
bloccati. Un matrimonio attivo differente non viene dissolto o sovrascritto:
correggerlo dalla scheda membro con il workflow Marriage esistente.
MarriageService e il lock/transazione esistenti sono riusati, non duplicati.

## Conferma e audit

Lista compatta, senza quaranta form aperti; tap apre il dettaglio della riga.
Nome/cognome, contatti, data, ruolo, tappa, note e coniuge sono revisionabili.
Il responsabile conferma la verifica complessiva prima della scrittura.
La conferma PostgreSQL e serializzabile: crea/riusa Person e CommunityMember,
applica collegamenti coniugali, salva risultati e audit in una transazione.
UpdatedAt e token di concorrenza per bozza e righe. Stato finale CONFIRMED;
una seconda conferma restituisce i conteggi senza duplicare persone o note.
Hash univoco per comunita+sorgente impedisce un secondo import dello stesso file.

Audit con oid/tid JWT reali: caricamento, selezione fogli, revisione righe,
conferma e creazione matrimonio. Conferma registra totale righe, nuove persone,
persone esistenti riusate, righe con duplicati risolti e righe ignorate.
Non si scrivono nomi, contatti, note riservate o token nei log di audit.

## Rubrica e integrazioni

/mobile/community resta La mia comunita e aggiunge Importa elenco per gestori.
Ricerca per nome/cognome/telefono, anche con formattazione diversa dei numeri.
Righe mobile con nome, ruolo, telefono se presente e indicatore account.
Email e azioni Chiama/WhatsApp/Email restano nella scheda esistente; coniuge
rimanda alla relativa scheda. Nessuna obbligatorieta di account o contatti.
Il calendario gia legge gli stessi CommunityMember attivi: beneficia dei nomi
importati senza adattatori o copie di anagrafica. Compleanni e futuro linking
onboarding usano le stesse Person. Non si auto-collega un account per una sola
email non verificata e non viene cambiata l'autenticazione.

Route: /mobile/community/import, /mobile/community/import/:id,
/mobile/community/import/:id/row/:rowId. La bottom nav conserva le quattro voci.
API protette: GET /api/me/community/directory-imports e GET /:id;
POST /text, POST /file (multipart), PUT /:id/selection,
PUT /:id/rows/:rowId, POST /:id/confirm. Nessun CommunityId ricevuto nel body.

## File originali e configurazione

Riuso ICalendarOriginalStorage e Calendar__OriginalsPath su volume persistente
privato, fuori dal webroot. Estensioni ammesse .xlsx/.csv, nomi file casuali;
nel DB soltanto riferimento e metadata, non byte o base64 dell'originale.
Le righe strutturate mantengono il testo delle celle per audit/revisione.
Senza archivio configurato CSV/XLSX rispondono 503 controllato; testo funziona.
Nessun account Blob/secret inventato. Il futuro adapter Blob puo riusare la stessa
interfaccia. Backup, retention e pulizia degli originali orfani sono configurazioni
operative da definire prima dell'uso oltre il TEST, trattandosi di dati personali.

## Migration

20261119214828_AddCommunityDirectoryImport: SOLO CREATA, non applicata ad Azure.

CommunityDirectoryImports: Id identity, CommunityId, SourceType, SourceHash,
OriginalFileName, OriginalReference, RawText, Status, CreatedBy/CreatedAt,
ConfirmedBy/ConfirmedAt, UpdatedAt, NewPeopleCount, ExistingPeopleCount, IgnoredCount.

CommunityDirectoryImportRows: Id identity, ImportId, SourceSheet/Locator/Text,
SourceSelected; FirstName/LastName/Phone/Email/BirthDate/BirthDateRaw;
Role/RoleRaw/Stage/Notes/SpouseRaw; NeedsReview/Reviewed/Action;
TargetPersonId, UpdateExisting, UpdateRole, DuplicateConfirmed, ApplySpouse,
SpousePersonId, SpouseRowId, ResultPersonId, UpdatedAt.

Indici: UNIQUE (CommunityId,SourceHash); (ImportId,SourceSheet);
TargetPersonId, SpousePersonId, SpouseRowId, ResultPersonId.
FK import->Community RESTRICT; riga->import CASCADE; riga->Person (tre riferimenti)
RESTRICT; riga->riga coniuge RESTRICT. Non e esposto alcun DELETE.
Integer/date/boolean/uuid/timestamptz/text PostgreSQL; campi opzionali nullable.
Default di dominio: DRAFT, NEW, SourceSelected=true, altri flag false, conteggi zero;
timestamp assegnati nelle operazioni, senza seed o default SQL dinamici.
Nessuna colonna aggiunta/modificata a Person/User/CommunityMember/Marriage.

Push di entrambi i repository sospeso fino a conferma migration TEST applicata.
Dalla sessione con connessione configurata, senza stampare o inviare segreti:

```powershell
dotnet ef database update --project C:\Dev\GestionaleApiClean\Gestionale.csproj --startup-project C:\Dev\GestionaleApiClean\Gestionale.csproj
```

## Verifiche

Backend: dotnet build, dotnet test; runner reali Tests/Identity, Tests/Calendar e
Tests/Directory con dotnet run. Il progetto API non contiene test VSTest scoperti;
i runner console fanno le asserzioni con EF InMemory, non contro Azure.
DirectoryChecks copre parsing, contatti opzionali, duplicati e normalizzazione,
assenza di creazioni in parsing, scoping, coniugi, ruoli/deleghe, idempotenza,
righe ignorate, audit, calendario e originali senza storage.
Frontend: test auth e Playwright sulla build production; fixture da 40 righe,
testo, upload CSV/XLSX con storage mancante, selezione fogli, singolo dettaglio,
riuso/nuova/ignora, coniuge, conferma, ricerca telefono e bottom nav.
Viewport Android/iOS 320/390/412 con verifica overflow e screenshot.
Build Angular, cap sync android/ios e assembleDebug. Nessuna build Xcode su
Windows; upload tramite picker e sessione su dispositivi fisici restano da provare.
