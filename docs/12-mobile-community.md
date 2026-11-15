# La mia comunita mobile

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
Marriage e letto soltanto: nessun nuovo modello o editor coppie in questa fase.

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
