# Onboarding e appartenenza backend

## Regole applicate

Riferimenti letti: 01 (persona, ruolo, contesto), 02 (incarichi catechistici
non dedotti dalla selezione di un carisma), 03 (identita e privacy individuale),
07 (JWT e associazione tramite oid/tid).

La richiesta precedente salvava esclusivamente localStorage. Con API_SCOPE
configurato l'onboarding reale non usa quel percorso; l'anteprima conserva il
mock. La scelta Nessun carisma e valida e richiede MEMBER, non privilegi.

## Endpoint

Tutti richiedono ExternalIdUser, quindi JWT verificato e access_as_user.

- GET /api/onboarding/parishes: parrocchie reali dal database.
- GET /api/onboarding/current: richiesta del solo account JWT corrente.
- POST /api/onboarding/complete: crea/riusa User e richiesta di appartenenza.
- GET /api/onboarding/requests: ultime 100 richieste visibili all'approvatore.
- POST /api/onboarding/requests/{id}/approve: completa il collegamento.
- POST /api/onboarding/requests/{id}/reject: respinge una richiesta pendente.
- POST /api/onboarding/invitations: emette un invito personale verificabile.
- GET /api/me: contesto, permessi e conteggio membri attivi della comunita DB.
- GET /api/me/community: membri essenziali della sola comunita autorizzata.

Nessun endpoint riceve oid/tid dal client. Non si associano identita per email
o nome. ParishId deve esistere nel DB. Community si trova con ParishId + Number;
il numero non e mai una chiave primaria. Se manca, si crea soltanto durante
approvazione di sistema. Non si creano parrocchie dai dati mock.

## Richiesta, invito e approvazione

Una richiesta senza prova resta IN_ATTESA_APPROVAZIONE. Vengono salvati i dati
minimi, ruolo/tappa richiesti e data consenso per la richiesta di accesso.
Questo consenso non sostituisce i futuri consensi individuali di dettaglio.
User viene creato con oid/tid, senza password di accesso custom. Person e
membership vengono create solo dopo autorizzazione, non per ogni invio pendente.

La tabella CommunityAccessRequests ha una richiesta unica per User. Reinviare
non duplica User o richiesta. Una appartenenza gia attiva compatibile e riusata;
reinviare non cambia ruolo e non sposta l'utente in un'altra comunita.

Gli inviti sono generati da un responsabile autorizzato per una persona gia
censita nella propria comunita o dall'amministrazione di sistema. Conservano
il ruolo gia autorizzato della membership, non uno scelto dal destinatario.
Il token casuale a 256 bit e restituito una volta; nel DB si salva solo SHA-256.
Scade dopo 7 giorni, richiede email destinatario compatibile e membership ancora
attiva con lo stesso incarico. Il possesso della sola email non basta. Un invito
consumato non puo essere usato da un secondo account.

Il codice invito nell'URL onboarding viene ricordato per un'ora in sessionStorage
prima del bootstrap, per attraversare il redirect Microsoft. Non e identita o
fonte di ruolo: viene validato dal backend. Nessuna email reale viene inviata.

Un responsabile approva Fratelli, servizi e CO_RESPONSIBLE della propria comunita.
Solo RESPONSIBLE richiede l'amministrazione superiore; nessuno puo approvare la
propria richiesta, nemmeno un amministratore. CATECHIST e rifiutato nelle nuove
richieste ordinarie, ma dati, membership e inviti gia autorizzati non sono eliminati.
Un Corresponsabile con APPROVE_MEMBERS puo approvare solo MEMBER della stessa
comunita. Non puo approvare servizi, Corresponsabili o Responsabili.

Per amministrazione iniziale configurare nell'ambiente backend i GUID degli
account autorizzati in Onboarding__AdminObjectIds__0, __1, ecc. Il confronto usa
l'oid del JWT validato del tenant API. Non usare la lista email mock Angular,
header fiduciari o ruoli scelti nel browser. Se la lista e vuota, nessun account
si autoabilita come amministratore. Questo e un bootstrap dell'amministrazione,
non un'associazione manuale degli utenti ordinari.

La schermata di approvazione e disponibile nelle dashboard generale,
responsabile e Global Admin: il backend controlla sempre l'autorizzazione.
Se esiste una persona censita, l'approvatore la seleziona dopo verifica. Per
evitare duplicati un nome/email compatibile blocca la creazione automatica di
una nuova Person, ma non viene usato come prova di identita. PersonId e unico
tra User. Se necessario una correzione amministrativa precede il collegamento.

Approvazione salva atomicamente Person, CommunityMember, User.PersonId e
User.CommunityId. Il ruolo risiede nella membership DB. Transazioni serializzabili,
indici univoci e concurrency token proteggono richieste e consumo inviti.

## Frontend e stato pendente

Il form reale carica parrocchie e richiesta salvata tramite API, mantiene
feedback/validazione e attende POST complete e refresh GET me. Solo
linkedToCommunity=true apre /gestionale-cn/dashboard. Uno stato pendente resta
sull'onboarding con Verifica approvazione. Errori non cancellano i dati del form.
Il contesto resta in memoria per account, senza recuperare privilegi da storage.

La pagina Comunita legge il nuovo endpoint scoped: niente membri locali mescolati
ai record DB. POST /api/me/community/members censisce una Person e una membership
MEMBER, senza User e senza accettare consensi altrui. Richiede EDIT_MEMBRI, deriva
CommunityId dal contesto JWT/DB e ignora ruoli/comunita aggiuntivi del client.
Duplicati compatibili sono bloccati; la successiva approvazione seleziona
esplicitamente la Person censita, senza dedurre identita da email o nome.
Modifica avanzata, coppie/unita e consensi di dettaglio non sono sostituiti da
questo inserimento individuale minimo. Demo e anteprima restano separate.

## Deleghe operative e audit

GET /api/onboarding/delegations e PUT /api/onboarding/delegations/{personId}
richiedono il Responsabile attivo oppure l'admin superiore configurato. Comunita e destinatario CO_RESPONSIBLE sono
controllati sul DB. La whitelist e in CommunityPermissions; il ruolo formale
non cambia. Ogni sostituzione/revoca e auditata. /api/me rilegge le deleghe;
Profilo mobile offre Aggiorna profilo e permessi. La gestione si apre da
Altro > Appartenenze e deleghe. Il backend restituisce canApprove/canReject
per ogni richiesta: la UI non deduce l'autorizzazione dalla selezione di un ruolo.
Per il Responsabile il contesto e sempre derivato da /api/me. L'admin superiore
puo selezionare un CommunityId DB con querystring GET o payload PUT per registrare
una delega anche se il Responsabile non e digitale; solo l'oid amministrativo
validato concede questa facolta, mai il CommunityId del browser.

Il Corresponsabile puo emettere inviti verificati solo con EDIT_MEMBRI e
APPROVE_MEMBERS insieme e solo per membership MEMBER: la sola gestione anagrafica
non aggira la verifica dell'appartenenza. Gli inviti mobile generano URL pubblici,
non localhost. CommunityActionAudits conserva attore JWT oid/tid, azione, target
e contesto, senza token, email o consensi delegati. I nuovi endpoint mutanti
scrivono audit nella stessa transazione dei dati. Le API legacy ProxyTrust
non diventano automaticamente equivalenti alle nuove API JWT scoped.

## Aggiornamento schema di questa fase

Migration CommunityOperationalDelegations: crea CommunityMemberDelegations e
CommunityActionAudits; non altera o elimina ruoli Catechista, Person o User.
E stata preparata, NON applicata ad Azure. Applicarla PRIMA del deploy operativo
con una connessione test gia configurata in secrets/env:

```powershell
cd C:\Dev\GestionaleApiClean
dotnet ef database update --project .\Gestionale.csproj --startup-project .\Gestionale.csproj
```

Il form carica le comunita reali da GET /api/onboarding/parishes/{id}/communities.
Solo il richiedente Responsabile puo proporre un numero non ancora censito,
che viene creato esclusivamente dopo approvazione superiore. Il numero non e un ID.
Pending mostra comunita/ruolo/stato; RESPINTA consente correzione e ripresentazione
sulla stessa richiesta. Dopo approvazione /api/me linked=true apre /mobile/home.

Verifiche di questa fase: 67 controlli backend Identity (JWT locale + DB in memoria),
24 test auth frontend e 21 scenari UI, inclusi pending/home e rifiuto/ripresentazione.
dotnet test sul progetto API non scopre suite: i controlli effettivi si eseguono
con dotnet run --project Tests/Identity/IdentityChecks.csproj.
Build .NET senza errori, con warning XML/NuGet esistenti; build Angular con warning
CSS/CommonJS. Node 22 e due worker sono stati usati per evitare uscite locali
senza diagnostica di alcune esecuzioni Node 20. Nessuna configurazione web modificata.

## Migration e verifiche

Migration: CompleteUserCommunityOnboarding. Crea soltanto tabelle di workflow
CommunityAccessRequests e CommunityAccessInvitations; riusa User, Person,
CommunityMember, Community, Parish. Rende unico Users.PersonId: verificare
eventuali associazioni duplicate prima dell'applicazione.
Allarga inoltre People.Email a 256 caratteri; prima di un rollback verificare
che nessun indirizzo superi il precedente limite di 50 caratteri.

La migration non e stata applicata al DB Azure. Serve una connection string
locale configurata in user-secrets/env e poi:

```powershell
dotnet ef database update --project .\Gestionale.csproj --startup-project .\Gestionale.csproj
```

Questo applica anche eventuali migration precedenti non ancora applicate.
Nessuna password viene salvata nei sorgenti. Senza schema aggiornato le API del
nuovo workflow non sono utilizzabili: il deploy del codice da solo non migra il DB.

I test in Tests/Identity verificano pending senza autoassegnazione, approvazione,
inviti, riuso Person, idempotenza, parrocchie con numero uguale, CommunityId reale,
scope/tenant/firma, rigetto header fiduciari e isolamento dati. Non sostituiscono
il test end-to-end Microsoft + PostgreSQL Azure, non eseguito in questo ambiente.

MSAL config, scope, audience, strutture, richieste strutture, Maps, Dockerfile
e workflow non vengono modificati da questo intervento.

Verifiche locali finali: 35 test di identita superati, build .NET riuscita,
nessuna differenza tra modello EF e snapshot. Build Angular riuscita con
`npm run build -- --progress=false --output-path dist/avalon-ng-onboarding-final`:
la cartella standard aveva file di output bloccati. Restano warning CSS/Leaflet
e avvisi NuGet sulle dipendenze esistenti; non sono stati aggiornati pacchetti.
