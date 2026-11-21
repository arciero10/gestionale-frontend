# Inviti e richieste accesso alla comunita

## Delivery email: verifica infrastruttura

Vedere [17-email-delivery.md](17-email-delivery.md): nessuna risorsa ACS Email
visibile nella sottoscrizione attiva e nessuna configurazione Email__ nella
Container App. Sono predisposti contratto e template; l'invio reale resta
disabilitato, senza modifiche al flusso mobile o al lifecycle degli inviti.

## Modello e confini

Person e l'anagrafica reale; CommunityMember conserva comunita, ruolo, tappa e
appartenenza. User e opzionale e collega tid+oid Microsoft a Person. Non viene
creata una seconda rubrica. Il censimento manuale richiede il nome, consiglia il
cognome e non richiede email. L'email e invece obbligatoria per invitare nell'app.
Calendario/incarichi continuano a riferirsi a PersonId, anche senza User.
Compleanni restano soggetti alle regole comunitarie gia esistenti.

## Inviti

Si estende CommunityAccessInvitation, senza una tabella parallela. Un responsabile
invita solo una membership attiva della propria comunita; un corresponsabile
necessita EDIT_MEMBRI e APPROVE_MEMBERS e puo invitare solo MEMBER. L'admin
onboarding non ottiene accesso globale alla rubrica o all'emissione inviti.

- POST /api/onboarding/invitations: communityId deve coincidere col contesto;
  personId deve essere membro della stessa comunita. Email opzionale nel payload
  per aggiungerla al censimento, ma necessaria nel record finale.
- GET /api/onboarding/invitations: stati della sola comunita autorizzata.
- POST /api/onboarding/invitations/{id}/cancel: annullamento locale autorizzato.
- GET /api/onboarding/invitations/{publicId}: destinatario autenticato, stessa email.
- POST /api/onboarding/invitations/{publicId}/accept: privacyConsent personale,
  JWT valido, stessa email, invito pendente/non scaduto, incarico ancora compatibile.

Stati derivati dai timestamp: PENDING, ACCEPTED, EXPIRED, CANCELLED. Scadenza 7 giorni.
Ri-emettere annulla gli inviti precedenti non consumati. Uso singolo, controlli di
concorrenza e transazioni serializzabili. Nessuna nuova Person o CommunityMember
durante accettazione: si collegano quelli gia censiti. /api/me ritorna linked true.
Email diversa: "Questo invito e associato a un'altra email". Nessun collegamento
automatico cercando semplicemente la stessa email nel DB.

Il link e `https://test.eventidicomunita.it/?inviteId=<uuid>`: identificativo pubblico
casuale, NON bearer credential, e non contiene il token. E inutilizzabile senza
JWT del destinatario. La configurazione opzionale CommunityInvitations:PublicOrigin
accetta solo origin HTTPS, senza credenziali. Il token legacy a 256 bit resta
compatibile con le vecchie integrazioni; solo SHA-256 nel DB e restituzione una volta.
La nuova UI non usa token nell'URL. Audit: attore reale oid/tid, emittente UserId,
invito, PersonId e comunita; niente token/password nei log o audit.

## Email e deep link

CommunityInvitationService usa ICommunityInvitationEmailSender. In questa versione
PreparedCommunityInvitationEmailSender restituisce PREPARED_NOT_SENT: prepara
oggetto/corpo, NON invia email e non finge una consegna. La UI permette copia link
e apertura client email con testo preparato. "Invito inviato" nella lista indica
un invito emesso per consegna manuale, non una ricevuta email.

Provider futuri: Azure Communication Services Email, Graph/Exchange o provider
esistente, con credenziali gestite esternamente e outbox/retry durevoli. Non sono
state aggiunte password SMTP, segreti o access token al repository.

V1: il sito ricorda il publicId per un'ora in sessionStorage prima del login e
mostra accettazione nell'onboarding web/mobile. Non e fonte di autorizzazione.
Android App Links/iOS Universal Links richiedono assetlinks.json, AASA, domini
associati e consegna del publicId dal link handler; non sono abilitati in questa
fase. Il passaggio sito -> app installata va collaudato con tale configurazione.
La Native Authentication e il login web non sono modificati.

## Richieste spontanee e revisione

Riutilizzati CommunityAccessRequest e POST /api/onboarding/complete: User creato
dal JWT, parrocchia DB e comunita reale (parishId+numero), richiesta pendente.
Le scelte diocesi/settore della UI esistente non creano enti autorevoli nel DB.
Nessuna autoapprovazione: Responsabile richiede superiore configurato; gli altri
ruoli rispettano le deleghe gia esistenti.

GET /api/onboarding/requests espone email richiedente e candidati della sola
comunita amministrabile, escludendo persone gia collegate ad altro account.
Matching riusa DirectoryImportRules (nome normalizzato, email, telefono, fuzzy
conservativo). Mai merge automatico: "Collega a persona esistente" e esplicito.
"Crea nuova persona" mostra nome/cognome, ruolo, tappa e coniuge opzionale;
il backend blocca creazione se esistono candidati compatibili. Rifiuto usa la
richiesta esistente. Audit MEMBERSHIP_APPROVED/REJECTED, no doppia anagrafica.
Il coniuge passa da MarriageService, con regole di unicita gia presenti.
Home segnala richieste pendenti; Comunita -> Richieste accesso apre la revisione.
L'admin superiore vede le richieste necessarie. Fuori dalla propria comunita vede
solo le corrispondenze pertinenti alla richiesta (ID/nome), non l'intera rubrica;
puo cosi approvare anche il primo Responsabile gia censito senza un nuovo doppione.

## Profilo personale e foto

GET/PUT /api/me/community/profile identificano solo la Person dell'account JWT:
telefono, email personale, data nascita e rimozione foto. Ignorano PersonId/ruolo
del browser. L'email personale non cambia l'identita Microsoft di login.
Ruolo, appartenenza, tappa, coniuge e incarichi restano dati comunitari autorizzati.
Preferenze notifiche usano /api/me/community/privacy, senza cambiare consensi.

Dopo invito: /mobile/complete-profile. Dopo approvazione: MobileHome mostra
"Completa il tuo profilo" e "Completa piu tardi". Il rinvio e una preferenza UI
locale per UserId, non e stato di autorizzazione. Nessun campo e obbligatorio.
Avatar rotondo, picker foto con preview locale/rimozione; nessun URL tecnico in UI.
PhotoUploadAvailable=false: preview esplicitamente NON salvata; nessun binario in
PostgreSQL. Futuro storage Blob privato, endpoint upload autorizzato con limiti,
MIME/decoding e URL temporanei. Nessuna chiave storage inventata.

## Notificabilita

Un incarico offline e sempre valido. Nel dettaglio calendario del gestore si
distinguono NO_ACCOUNT e ACCOUNT_WITHOUT_PUSH: account collegato NON significa
dispositivo registrato o push consegnabile. Nessuna push reale e attivata qui.
La pianificazione compleanni esistente considera solo User attivi con preferenza,
senza escludere i fratelli offline dai contenuti comunitari.

## Migration e pubblicazione

20261120122111_CommunityInvitationLifecycle, SOLO CREATA, NON APPLICATA A TEST.
Solo CommunityAccessInvitations:
- PublicId uuid nullable, indice UNIQUE (legacy NULL ammessi).
- CreatedAt timestamptz non nullable; default migration epoch, backfill legacy
  ExpiresAt meno 7 giorni; nuove emissioni assegnano UTC corrente dal servizio.
- IssuedByUserId integer nullable, FK Users.Id RESTRICT e indice.
- CancelledAt timestamptz nullable, concurrency token insieme a ConsumedAt.
- indice (CommunityId,PersonId,CreatedAt), sostituisce indice FK a due colonne.
Restano FK composite alla membership e hash token UNIQUE. Nessuna modifica a
Person/User/CommunityMember, nessuna nuova tabella richieste/inviti.

NON avviare host Development contro TEST: l'initializer esistente puo migrare.
Push di entrambi i repository sospeso fino ad applicazione TEST e conferma.
Comando dalla sessione con connessione gia configurata, senza stampare segreti:

```powershell
dotnet ef database update --project C:\Dev\GestionaleApiClean\Gestionale.csproj --startup-project C:\Dev\GestionaleApiClean\Gestionale.csproj
```

## Verifiche

Test HTTP con JWT firmati solo per test + EF InMemory: inviti/email diversa,
scadenza, riuso, cancellazione, deleghe, audit, profilo owner-only, richieste/fuzzy,
assenza duplicati e /api/me linked. Nessuna email o scrittura al DB Azure.
Runner Identity, Calendar e Directory; dotnet test dell'API non scopre suite,
le asserzioni reali sono nei runner console. UI Playwright con bridge SDK mock e
API mock su build production: Android/iOS responsive, bottom nav, inviti,
accettazione e profilo, revisione esistente/nuova persona e regressioni web.
Build Angular/.NET, cap sync android/ios, APK debug. iOS Xcode e dispositivi fisici
non verificabili su Windows; delivery e universal link richiedono collaudo futuro.
