# La mia comunita mobile

> Aggiornamento rubrica V1: la lista mostra ora telefono e indicatore account
> se restituiti dall'API; ricerca anche per telefono e azione Importa elenco
> per Responsabile/Corresponsabile delegato. Questo supera il precedente
> requisito di non mostrare contatti nella lista. Dettagli in docs/15-community-directory-import.md.

> Aggiornamento vincolante: telefono/email/coniuge/compleanno sono dati comunitari,
> anche per membri senza User. ShowPhone/ShowEmail/ShowFamily/ShowBirthday sono
> legacy e non filtrano piu questi dati. La data completa e le foto restano
> distinte. Solo le preferenze notifiche sono esposte nella pagina personale.
> Le sezioni storiche sui vecchi consensi di visibilita sono superate dalla
> regola corrente di docs/03 e docs/13-mobile-birthdays.md.

## Dominio e contesto

Implementazione dedicata mobile, non adattamento della pagina desktop.
Riusa User, Person, CommunityMember, Community, Parish e Marriage.
CommunityId, PersonId corrente, ruolo e deleghe provengono dal JWT validato
e dalle membership attive nel DB, mai da localStorage o query del browser.
L'admin onboarding non ha eccezioni per leggere altre comunita.

## Route e schermate

- /mobile/community: contesto reale, numero membri, ricerca nome/cognome,
  conteggio singolare/plurale, avatar o iniziali e ruolo. La tappa viene mostrata
  solo se presente nella risposta della lista; nessuna richiesta per-persona
  viene aggiunta per recuperarla. Compleanno solo se restituito dal backend.
- /mobile/community/member/:id: scheda minima, modifica autorizzata,
  coniuge se condiviso e privacy personale.
- /mobile/community/add: inserimento anagrafico senza creare User.
- /mobile/comunita: alias alla nuova lista per compatibilita.

La Home e il tab Comunita puntano alla nuova lista; la bottom navigation resta
a quattro voci. Loading, errore con retry, lista vuota e nessun risultato sono
gestiti senza tabelle o sidebar desktop. I dati API restano in memoria.

Rifinitura UX: riepilogo compatto con comunita/parrocchia/ruolo, ricerca
"Cerca nella comunita" con cancellazione, righe touch con chevron e nessun
telefono/email nella lista. Aggiungi fratello resta una pagina dedicata,
mai un form inline. La mia scheda/privacy e Richieste e storico sono
collegamenti secondari sotto l'elenco; lo storico usa /mobile/approvazioni
ed e proposto solo con permessi di approvazione. Nessuna richiesta di
appartenenza approvata e caricata o mostrata nella pagina principale.
Contratti API, consensi e autenticazione restano invariati.

## API contestuali

GET /api/me/community riusato anche dal web, stessa forma context/members,
con canAddMember/assignableRoles aggiunti e contatti filtrati per consenso.
Il web mantiene layout e route: i dati privati vengono omessi anche per questo
consumatore, per non lasciare un endpoint alternativo che aggiri la privacy.

- GET /api/me/community/members/{personId}: dettaglio della membership attiva.
- POST /api/me/community/members: censimento con EDIT_MEMBRI.
- PUT /api/me/community/members/{personId}: modifica dei campi consentiti.
- GET/PUT /api/me/community/privacy: esclusivamente consensi della Person corrente.

Fratello non modifica schede. Corresponsabile richiede delega EDIT_MEMBRI,
puo censire Fratelli ma non gestire ruoli. Responsabile con MANAGE_RUOLI gestisce
ruoli ordinari; RESPONSIBLE necessita sempre approvazione superiore.
CATECHIST resta nel dominio legacy ma non e assegnabile dal censimento.
Nome/email compatibili nella stessa comunita bloccano un secondo censimento.
Il linking futuro usa inviti verificati/approvazione e Person esistente, non
un'associazione automatica basata solo sull'email.

Privacy: ShowPhone/ShowEmail/ShowBirthDate/ShowPhoto/ShowFamily e preferenze
ReceiveBirthdayNotifications/ReceiveCommunityNotifications sono false di default.
Il titolare puo impostare un URL foto HTTPS, senza upload. Le notifiche sono
solo preferenze persistite: nessun motore invio notifiche e introdotto qui.
Le note libere Person.Notes non vengono mai restituite.
Un campo privato omesso da una modifica resta invariato.
Audit registra oid/tid reali per inserimenti, modifiche, ruoli e consensi.
Marriage e riutilizzato anche per il collegamento operativo del coniuge:
vedere la sezione anagrafica e coniugi sotto.

## Schema e rilascio

Migration backend: 20261115214806_CommunityMemberPrivacy.
Aggiunge solo campi a People e Stage a CommunityMembers, nessuna tabella nuova.
Applicazione al DB Azure TEST confermata dall'utente il 15 novembre 2026.
La rifinitura UX mobile non crea migration ne modifica il backend.
Per altri ambienti non ancora aggiornati, applicarla prima del deploy operativo
con connessione gia configurata in secrets/env, senza password nei sorgenti:

```powershell
cd C:\Dev\GestionaleApiClean
dotnet ef database update --project .\Gestionale.csproj --startup-project .\Gestionale.csproj
```

## Verifiche

Backend: dotnet build; dotnet test; runner effettivo
dotnet run --project Tests/Identity/IdentityChecks.csproj.
Il progetto API non contiene suite scoperte da dotnet test; il runner verifica
JWT locale e DB EF in memoria (non un database PostgreSQL reale).

Frontend: npm run test:auth-mobile; npm run build;
npm run test:mobile-welcome su production con bridge Native Auth/API simulati.
Copertura community: isolamento API, campi non serializzati senza consenso,
revoca, auto-consenso, Marriage, deleghe, censimento senza account, audit,
ricerca, scheda, creazione e viewport 320/390/412/768; regressioni login web
e routing pending/home preesistenti.

Sincronizzare Capacitor Android/iOS. assembleDebug richiede JDK 21.
Su Windows il sync iOS non e una compilazione Xcode.
Su dispositivo reale, dopo migration/deploy API: login, ricerca, creazione,
privacy condivisa/revocata tra due account della stessa comunita,
rete assente/retry, foto non raggiungibile e ritorno dalla scheda alla lista.
Verificare iOS su macOS/dispositivo; i mock non certificano Keychain o notifiche.

Rifinitura UX verificata: build Angular riuscita (warning preesistenti),
24 test auth e 23 scenari/check UI production passati. Controllati ricerca,
cancellazione, singolare/plurale, form su pagina separata, assenza tabelle e
contatti nella lista, link secondario storico senza caricare richieste,
bottom nav e viewport 320/390/393/412/768 senza overflow orizzontale.
Sync Android/iOS e assembleDebug riusciti con JDK 21. Nessuna build Xcode
o nuova verifica su dispositivo fisico eseguita in questa rifinitura.

## Anagrafica e coniugi

Nascita opzionale: input date nativo, vuoto per default, max oggi e riepilogo
dd/MM/yyyy. Il giorno viaggia come YYYY-MM-DD (DateOnly API), viene persistito
nel campo esistente come mezzanotte UTC. Per visualizzarlo il formatter riceve
esplicitamente YYYY-MM-DDT00:00:00Z e formatta in UTC: nessuno slittamento di
un giorno in elenco, scheda o form. Il picker apre sull'anno scelto dal sistema
operativo, senza attribuire una data fittizia alla persona.

Scheda: Account collegato / Non ancora registrato, tappa, ruolo e dati personali
consentiti. Sposato/a deriva dal coniuge attivo condiviso, non da un nuovo
campo libero. Nessuna deduzione di stato celibe/nubile se il dato e privato.

GET /api/me/community/spouse-options?personId=... e esclusivamente operativo:
richiede Responsabile o Corresponsabile con EDIT_MEMBRI, sempre nella comunita
derivata dal JWT. Per nuova persona si omette personId. Restituisce candidati
validi, coniuge attuale e versione currentMarriageId per evitare modifiche
stale. Esclude se stessi, estranei e persone occupate da un altro matrimonio.
Non restituisce telefono/email/date/consensi dei candidati.

POST/PUT members estesi con updateSpouse, spouseId e expectedMarriageId.
Se il coniuge non cambia il client non invia una modifica matrimoniale.
La correzione e esplicita, richiede la versione corrente e disattiva la vecchia
relazione; nessuna cancellazione. Una coppia storica viene riattivata nella
stessa riga per rispettare l'indice univoco A/B. Marriage non ha intervalli
temporali: la cronologia delle modifiche e nel CommunityActionAudit.
Nessuna entity duplicata e nessuna migration in questa fase.

I matrimoni sono bidirezionali: un solo record, non due campi indipendenti.
Tutti i controlli sono ripetuti al salvataggio. Transazione serializable,
lock PostgreSQL transazionale condiviso tra scritture contestuali, controlli
su entrambe le colonne e indici esistenti impediscono assegnazioni concorrenti.
Conflitti/versioni obsolete richiedono refresh (HTTP 409), senza replay automatico.
Scritture SQL esterne non passano dalla policy: non usarle per gestire matrimoni.

La rubrica continua ad applicare ShowFamily di entrambi; l'accesso al selettore
operativo e una permission distinta e non abilita consensi altrui.
Se il coniuge non esiste, censirlo normalmente prima, poi associarlo.
Nessun placeholder anonimo. Dopo il censimento si torna a /mobile/community
e la lista viene riletta dal backend.

Verifiche: 144 controlli backend (EF InMemory/JWT locali); test UI su production
per nascita futura, riepilogo italiano, selettore, scheda, coniuge condiviso,
account, modifica consentita e viewport 320/390/393/412.
La prova concorrente PostgreSQL reale non e stata eseguita; i test in memoria
non certificano lock/indici del provider. Prima del rilascio operativo provare
due modifiche simultanee sul DB test e i picker sui dispositivi Android/iOS.

Verifica finale 18 novembre 2026: build Angular production riuscita dopo pulizia
della cache Angular (un tentativo precedente aveva un deadlock esbuild).
Suite UI production passata sia in Europe/Rome sia in Pacific/Honolulu;
24 test auth passati. Sync Android e iOS riusciti, assembleDebug finale
riuscito con JDK 21. Build backend e 144 controlli Identity passati,
modello EF/snapshot allineati. Nessuna migration creata o applicata.
dotnet test non scopre suite nel progetto API: i controlli effettivi sono
eseguiti dal runner Tests/Identity. Restano warning preesistenti di build.
Nessuna nuova compilazione Xcode o prova su dispositivo fisico.
