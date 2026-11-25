# Invite Only: piattaforma, appartenenza, autorizzazioni

## Separazione dei flussi

Gli inviti comunitari esistenti restano in CommunityAccessInvitations: una
persona gia censita, un incarico gia autorizzato, JWT del destinatario, scadenza,
revoca e consumo. Le route /invite/UUID e i relativi endpoint non sono rimossi.

PlatformInvitations e' invece un invito alla piattaforma, emesso soltanto
dall'amministratore superiore gia configurato in Onboarding:AdminObjectIds.
Consumarlo crea/trova soltanto User tramite tid+oid. Non crea Person,
CommunityMember, Community o ruolo. Il backend resta fonte di autorizzazione.
Una richiesta senza invito e' respinta quando PlatformInvitations:Enabled=true.
Gli utenti gia collegati mantengono il contesto reale, senza acquisire nuovi ruoli.

Il token casuale ha 256 bit; nel DB e' conservato solo SHA-256, con indice UNIQUE.
Il link viene restituito una volta, con token nel fragment #token=..., non nel
path o query HTTP. API inspect/accept ricevono il segreto nel body POST e
richiedono JWT con email corrispondente. Audit: attori reali e ID, mai token/email.
Il client conserva il segreto solo in memoria e rimuove il fragment prima del
bootstrap Angular. Non salvarlo nei log o screenshot condivisi.
Se il processo termina o il login web effettua un redirect completo, riaprire
il link originale dopo l'accesso. Non promettiamo ripresa da storage persistente.

La nuova emissione prepara solo il link: nessun invio email, nessuna chiamata
ACS. La consegna reale resta una fase di collaudo successiva, non attivata qui.
Un invito scade entro 7 giorni, si puo revocare finche' non consumato, e non
puo essere consumato da una seconda identita'. Il retry della stessa identita'
dopo una risposta persa e' idempotente. Concorrenza: transazione serializzabile,
token di concorrenza su ConsumedAt/RevokedAt, indici identita' gia esistenti.

## Appartenenza e referente

POST /api/onboarding/complete riusa CommunityAccessRequest (unica per UserId).
ParishId deve esistere nel DB. Il numero di comunita NON e' la primary key.
Una comunita non ancora censita puo essere indicata esplicitamente nel form:
la sola domanda non crea dati comunitari o autorizzazioni.

Fratello, servizi e Corresponsabile restano soggetti a verifica. Il Responsabile
attivo della stessa comunita approva secondo le regole esistenti. Il
Corresponsabile approva solo Fratelli con delega APPROVE_MEMBERS. Un Responsabile
richiesto richiede un superiore distinto da se stesso. Nessuna nuova delega o
configurazione amministrativa viene assegnata da questa modifica.

In assenza di Responsabile con account attivo, la schermata pendente lo segnala.
POST /api/onboarding/referent salva nome/contatto sulla sola richiesta dell'attore
JWT, ancora pendente; i dati sono visibili all'interessato e ai revisori gia
autorizzati. Segnalare un contatto NON prova un incarico e NON assegna permessi.
La verifica organizzativa del contatto resta responsabilita' del revisore.
Solo l'approvazione collega User -> Person -> membership -> ID Community reale.
Matching e scelta esplicita di persone censite riusano il codice esistente.

## API e UI

- GET /api/platform-invitations/access: stato di ammissione dell'account JWT.
- GET/POST /api/platform-invitations: elenco/emissione, solo admin configurato.
- POST /api/platform-invitations/inspect e /accept: destinatario verificato.
- POST /api/platform-invitations/ID/revoke: revoca admin, senza revocare di
  nascosto un'appartenenza gia autorizzata.
- /invite/platform: ingresso condiviso web, iOS e Android; nessun metadato
  nominativo prima della verifica /api/me.
- Appartenenze e deleghe / Richieste di appartenenza: preparazione link per
  admin; revisione e referente negli stessi componenti gia usati.

Le membership gia autorizzate non cambiano parrocchia da un payload onboarding.
Correggere un account reale richiede prima identificazione inequivoca; non
rinominare parrocchie/comunita e non usare omonimia o email come auto-merge.
La verifica DB in sola lettura da questo PC non e' riuscita: TCP 5432 non
raggiungibile. Nessun record reale e' stato letto o corretto, nessun firewall
o impostazione Azure DB e' stato modificato. /api/me reale richiede il JWT
dell'interessato; i JWT fixture dei test non rappresentano gli account reali.

## Schema e rollout (nessuna applicazione automatica)

Migration: 20261125133148_InviteOnlyAdmission, PREPARATA SOLTANTO.
Aggiunge PlatformInvitations e due colonne nullable su CommunityAccessRequests:
ReferentName(100), ReferentContact(256). Non modifica membership, ruoli,
parrocchie, comunita, credenziali o account amministrativi esistenti.

Il workflow backend prepara l'immagine ma NON aggiorna la Container App finche'
la repository variable API_SCHEMA_READY non vale esattamente InviteOnlyAdmission.
Non contiene database update. Il TEST minReplicas=1 resta invariato.
PlatformInvitations:Enabled e' false se non configurato; i nuovi endpoint di
invito rispondono 503 finche' non abilitati esplicitamente.

Procedura operatore, solo dopo revisione e backup TEST:
1. Verificare destinazione eventidicomunita_test nella configurazione protetta.
   Non passare connection string/password negli argomenti di processo o log.
2. Revisionare Up/Down e generare gli script con dotnet ef migrations script.
3. Applicare manualmente la migration SOLO a TEST, dopo autorizzazione.
4. Confermare API_SCHEMA_READY=InviteOnlyAdmission nel repository backend;
   avviare manualmente Deploy Container App su main. Verificare Healthy/Running,
   traffico, minReplicas=1, CPU/RAM/max invariati e /api/me.
5. Abilitare PlatformInvitations__Enabled=true solo su TEST dopo verifica.
6. Validare gli inviti con fixture/account autorizzati prima di qualsiasi
   consegna applicativa reale. La UI prepara link ma non invia email.

Rollback: disabilitare il feature flag, fermare il deploy automatico rimuovendo
la conferma API_SCHEMA_READY e ripristinare l'immagine precedente PRIMA di
togliere colonne usate dalla nuova API. Esportare/archiviare in modo protetto
i nuovi dati se necessari. Lo script inverso si genera senza esecuzione:

```powershell
dotnet ef migrations script InviteOnlyAdmission 20261122113638_CommunityInvitationEmailDelivery --project .\Gestionale.csproj --startup-project .\Gestionale.csproj
```

Down elimina solo nuova tabella e due colonne: e' distruttivo per inviti e
referenti nuovi. NON revoca automaticamente User o membership gia approvati.
Non eseguire rollback DB mentre gira il backend che richiede il nuovo schema.

## TestFlight esterno e collaudo

Il workflow testflight-external.yml e' inattivo salvo conferma esplicita delle
repository variables IOS_EXTERNAL_DISTRIBUTION_ENABLED=true e
IOS_EXTERNAL_MIN_BUILD=numero minimo verificato. Non vengono configurate qui.
Verifica il gruppo esistente PANTELEIA - Beta Comunita' con il suo nome reale
accentato nel codice, esterno e appartenente alla stessa app.
Associa solo build VALID, non scadute, con Beta App Review esplicitamente
APPROVED e non gia associate. Non crea tester, non invia app alla revisione,
non modifica consensi export e non aggira Apple. Dopo l'approvazione il
controllo periodico ogni 6 ore associa le nuove build idonee. La notifica ai
tester resta regolata dalle impostazioni Apple del gruppo/build.
Riferimenti: https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers/

Prove locali: backend HTTP/JWT con EF InMemory (262 controlli), concorrenza,
isolation, token hash/revoca, richieste idempotenti, frontend auth/link/parser,
browser con SDK/API simulati per 6a Corresponsabile e 4a Fratello su entrambi
gli OS, nessuna rubrica prima dell'approvazione e referente. Test web controlla
rimozione fragment e assenza di metadati personali prima del login.
Queste prove non equivalgono a collaudo su iPhone, invio ACS reale o test di
locking PostgreSQL. Il collaudo reale richiede prima lo schema/deploy approvati.
