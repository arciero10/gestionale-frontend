# Compleanni, privacy e notifiche mobile

## Consensi

Riusa Person, CommunityMember, User e i flag ReceiveBirthdayNotifications,
ReceiveCommunityNotifications e ShowPhoto. Nessuna entity duplicata.

ShowBirthDate resta il consenso alla data completa in scheda/rubrica.
Il nuovo ShowBirthday e distinto: autorizza il calendario e il piano notifiche
con solo giorno/mese. Default false, senza migrare o dedurre consensi precedenti.
Attivare ShowBirthday non attiva ShowBirthDate e non divulga anno o eta.
Disattivarlo non revoca un eventuale consenso separato alla data completa.

Solo l'utente titolare salva i propri consensi via GET/PUT
/api/me/community/privacy. Oid/tid e PersonId vengono risolti dal JWT validato
e dal DB. Responsabile e Corresponsabile non possono accettare per altri.
La creazione Person non accetta privacy per conto dell'interessato.
Nel PUT il nuovo ShowBirthday omesso viene preservato, per compatibilita
con i client precedenti. I client attuali caricano e reinviano le preferenze
complete, preservando foto, contatti e le altre opzioni.

Anche con ShowBirthday erroneamente true, una Person senza User Microsoft
collegato e attivo non viene esposta ne diventa festeggiato nel piano.
Il linking futuro riusa Person esistente: dopo il collegamento il titolare
puo esprimere il consenso. Nessuna associazione automatica per email.

## API e visibilita

GET /api/mobile/birthdays usa esclusivamente la comunita corrente derivata
da User e membership attiva. Query communityId non attribuisce accesso.
Admin onboarding non ha bypass. Nessun compleanno nascosto e restituito
nemmeno al Responsabile; eventuali dati anagrafici sono un contesto separato.

Risposta: communityName, parishName, today (giorno corrente della comunita),
birthdays con memberId, personId, displayName, photoUrl se consentita, day,
month, dateLabel italiana, isToday, daysUntilBirthday, section e memberRoute.
Nessun anno di nascita, eta, BirthDate, telefono/email o note nel payload.
today contiene l'anno corrente di calendario, non l'anno di nascita.
Cache-Control no-store. Nessuna cache di compleanni in localStorage.

## Calendario

BirthdayService e testabile con TimeProvider. Il riferimento e Europe/Rome,
indipendente dal fuso del dispositivo. La nascita e letta come data di dominio,
senza conversioni locali del client.

Per ogni giorno/mese si calcola la prossima occorrenza nell'anno corrente,
oppure nell'anno successivo se gia passata. Ordinamento per giorni mancanti,
poi nome. Gestiti cambio anno e DST.

Regola 29 febbraio: 29 negli anni bisestili; 28 febbraio negli altri.
Il testo conserva il compleanno reale "29 febbraio"; il badge Oggi/Tra N giorni
e la notifica seguono l'occorrenza del 28 negli anni non bisestili.

Sezioni esclusive, calcolate dal server con questa priorita:
Oggi; Prossimi 7 giorni; Questo mese (solo anno e mese correnti); Prossimamente.
La stessa persona compare una sola volta.

## Mobile

/mobile/birthdays e dedicata mobile. /mobile/compleanni resta un alias.
Card Home reale: conteggio di compleanni tra oggi e i prossimi sette giorni,
oppure stato vuoto/non disponibile distinto. Nessun nome privato nel riepilogo.
Tap su un compleanno apre /mobile/community/member/:personId.
Loading, errore con retry, vuoto, refresh, avatar fallback e bottom nav esistente.

Profilo -> Privacy e notifiche apre /mobile/privacy.
Gestisce ShowBirthday, ShowBirthDate e le due preferenze notifiche esistenti.
La scheda personale mantiene gli stessi flag, non un secondo archivio.
Se il backend non espone ancora ShowBirthday, il nuovo pannello mostra
"Servizio compleanni in aggiornamento" senza fingere un salvataggio riuscito.

## Dominio notifiche

BirthdayNotificationService.PrepareAsync e interno, non un endpoint di
amministrazione esposto al browser. Riceve il contesto dal futuro worker
fiduciario, non un CommunityId selezionato liberamente dal frontend.

Produce festeggiati di oggi, destinatari UserId e messaggio aggregato.
Destinatari: account Microsoft attivo, membership attiva della comunita
corrente e ReceiveBirthdayNotifications=true. Tutti i festeggiati sono
esclusi dai destinatari dell'aggregato, anche se opt-in.
Non vengono inclusi account senza contesto corrente risolvibile.
Nessun messaggio se non ci sono festeggiati. Messaggio con soli nomi,
senza eta, nascita completa o contatti.

Non esistono ancora trasporto push, job schedulato, inbox persistente
o invio reale. Salvare una preferenza non richiede permessi OS e non abilita
di nascosto APNs/FCM. La UI segnala che le push non sono ancora attive.

## FCM e APNs: prossimo passo

Introdurre un trasporto separato dal servizio di dominio, con scheduler
Europe/Rome e idempotenza per comunita/data/destinatario. Rivalidare
membership e consensi prima dell'invio, non conservare snapshot sensibili
obsoleti. Definire retry e deduplicazione senza invii doppi.

Android: progetto Firebase/FCM e registrazione token dispositivo.
iOS: APNs, bundle/provisioning corretti e ambienti sandbox/production.
Possibile broker/provider server-side comune. Registrare token su endpoint
autenticati, gestire rotazione, revoca, logout e consenso OS esplicito.
Credenziali server FCM e chiavi/certificati APNs in secret store/Key Vault,
mai nel repository o nel client. Nessuna credenziale introdotta in questa fase.

## Migration e rilascio

20261118201404_AddBirthdayVisibility: aggiunge solo People.ShowBirthday,
boolean NOT NULL DEFAULT false. Nessuna modifica ai consensi esistenti.
Necessaria per distinguere il calendario senza anno dalla data completa.
Preparata, NON applicata al database remoto.

Per richiesta esplicita dell'utente il push backend resta SOSPESO finche
la migration TEST non e applicata e confermata. Il deploy automatico senza
schema aggiornato romperebbe anche /api/me, che legge Person.

Con connessione TEST gia configurata in secrets/env, senza password nei file:

```powershell
cd C:\Dev\GestionaleApiClean
dotnet ef database update --project .\Gestionale.csproj --startup-project .\Gestionale.csproj
```

Dopo verifica schema si puo pubblicare il commit backend e verificare il deploy.
Fino ad allora il frontend pubblicato gestisce l'API mancante con stato errore,
non con un elenco finto o mock. Nessuna dichiarazione di funzionalita live.

## Verifiche

Tests/Identity: JWT locali + EF InMemory, isolamento comunita, privacy, account
assente, ordinamento, dicembre/gennaio, 29 febbraio, Europe/Rome e rappresentazione
dello stesso istante a Honolulu, destinatari opt-in e aggregazione.
Non e un test PostgreSQL remoto ne un test di consegna push.
dotnet test sul progetto API non scopre suite: il runner effettivo e
dotnet run --project Tests/Identity/IdentityChecks.csproj.

Playwright su build production con bridge/API simulati: route, sezioni,
scheda, Home, toggles personali, loading/error/empty, viewport 320/390/393/412
e bottom nav invariata. Testare su device reali dopo migration/deploy;
iOS richiede macOS/Xcode per compilazione e prova APNs.

Esiti locali 18 novembre 2026: build Angular production riuscita con warning
preesistenti; 24 test auth passati; suite UI passata in Europe/Rome e
Pacific/Honolulu. Sync Android/iOS e assembleDebug con JDK 21 riusciti.
Build backend riuscita, 168 controlli Identity passati, snapshot EF coerente.
La migration non e stata applicata al DB e il push backend rimane sospeso
per richiesta dell'utente. Nessuna prova PostgreSQL remoto, Xcode o push reale.
