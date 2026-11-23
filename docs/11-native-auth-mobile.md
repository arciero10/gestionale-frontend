# Native Authentication mobile

## iOS unlock after successful Face ID

OTP-to-Welcome cause: authenticationGeneration was captured only in start().
Opening Mail between start and submit increments generation on background.
The successful OTP callback therefore returned unlock instead of authenticated.
Each validated foreground submit now captures the current generation; a new
background event DURING verification still invalidates that operation.

The previous gate rejected a successful LAContext callback if UIApplication was
still inactive. The new gate waits for didBecomeActive (at most 5 seconds),
then rechecks the session generation and cancellation before looking up the
MSAL account. It never authorizes an inactive app. Real backgrounding still
invalidates the generation; logout/lock cancel pending activation. No cache
is deleted. The five-second bound is a failure timeout, not a login delay.

Restore only offers unlock when MSAL reports a cached account. OTP completion
now also checks that MSAL exposes the account before reporting authenticated.
MSAL getAccessToken remains responsible for cached tokens and refresh; no
manual refresh token storage or authentication fallback is introduced.

Safe references distinguish IOS-unlock-AUTH_LOCAL_*, AUTH_APP_INACTIVE,
AUTH_SESSION_CHANGED, AUTH_CACHE_ACCOUNT_MISSING, IOS-token-AUTH_TOKEN_FAILED,
and IOS-PROFILE-UNAVAILABLE. No LAError descriptions or keychain contents cross
the bridge. The lifecycle race is reproducible in gate unit tests; the actual
device failure must still be confirmed with a new iPhone test and reference.

## iOS 1006: required MSAL query schemes

The 1005 device reference IOS-configuration-AUTH_CONFIGURATION is emitted
by configure(), before signIn starts. This reference alone does not retain
the original NSError and cannot prove which initialization check failed.
Source inspection found a concrete missing SDK prerequisite: Info.plist did
not register LSApplicationQueriesSchemes msauthv2 and msauthv3.

MSAL 2.17 sets bypassRedirectURIValidation for native auth without a custom
redirect, but its superclass still checks additional query schemes when the
default registered redirect is broker-capable. CommonCore selects the app's
registered msauth bundle redirect and requires BOTH query schemes. This is
a local initializer failure, not an OTP server response. Registering these
schemes only permits OS queries; it does not enable automatic browser fallback.

Sources: MSAL 2.17 MSALPublicClientApplication.m and its pinned CommonCore
32a4d4937a04c51897afefeb6f93c37fb95d27da,
IdentityCore/src/util/ios/MSIDRedirectUriVerifier.m.
The iOS tenantSubdomain convenience initializer constructs the CIAM authority;
Android's full authority constructor must not be copied into this iOS API.
Client ID, tenant, OOB challenge, keychain and tenant policy remain unchanged.
Real iPhone OTP verification remains required after installing 1006.

## iOS TestFlight 1004: errore prima dell'OTP (23 novembre 2026)

Il caso reale riferito dall'utente fallisce dopo invio email, prima del codice.
Non ci sono ancora codici SDK del dispositivo: non attribuire la causa a rete,
password, OTP, API profili o routing. La configurazione pubblica usa lo stesso
client/tenant di Android. La disponibilita OTP e le policy effettive del tenant
non sono verificabili dal solo repository e richiedono verifica amministrativa.

Il gruppo cache privato bundleIdentifier e espressamente supportato da MSAL:
non aggiungere Keychain Sharing o cambiare authority per tentativi. Fonte versione:
https://github.com/AzureAD/microsoft-authentication-library-for-objc/blob/2.17.0/MSAL/src/public/configuration/publicClientApplication/cache/MSALCacheConfig.h

Corretto il difetto certo di osservabilita: tutti gli errori SDK diventavano
AUTH_FAILED e configure perdeva il codice nel catch TypeScript. Il bridge ora
trasmette solo categoria, fase e fino a tre codici numerici server, senza
errorDescription, correlation ID, errorUri o payload. OSLog contiene solo questi
campi e durata; il logging interno MSAL resta disabilitato. La UI mostra messaggi
curati e un codice assistenza copiabile manualmente, non messaggi Microsoft.
Un generalError privo di codici resta AUTH_START_FAILED, non una diagnosi di rete.
AUTH_TRANSPORT e usato solo quando un errore di trasporto e realmente tipizzato.

OTP richiesto continua ad annunciare solo OOB. Un callback password durante quel
tentativo ferma la continuation e segnala metodo diverso; browser resta esplicito,
mai automatico. Risultati bridge sconosciuti sono rifiutati senza autenticare.
Token, /api/me e navigazione rimangono subordinati all'account/sessione reali.

Test: suite auth e completion, UI pre-OTP iOS con configurazione/trasporto/errore
generale, nessuna chiamata /api/me, nessun browser, nessun messaggio SDK grezzo.
Il workflow macOS esegue anche sei XCTest Swift sulla classificazione diagnostica;
non sono test di login reale contro Entra. La causa specifica del device rimane
da stabilire; una build diagnostica non certifica un fix del login iPhone.

L'utente ha autorizzato esplicitamente la pubblicazione diagnostica 1005 per
raccogliere il codice assistenza sul dispositivo reale, senza cambiare policy.

## Post-OTP completion and diagnostics (22 November 2026)

Android/iOS Native Authentication does not use the SPA getAllAccounts cache or
handleRedirectObservable. SDK submit returns an authenticated outcome after the
native account is assigned; then the API interceptor acquires an access token,
GET /api/me resolves the authoritative context and the existing route is opened.

Previously a completed transient /api/me error went directly to the root error
screen. The regression test explicitly required pressing Riprova accesso even
though the SDK session remained valid. The context GET now retries once, only
for completed HTTP/network failures 0/502/503/504, with 200ms bounded backoff.
401/403, invalid profile/token and Rx timeouts do not retry. Native /api/me uses
4s connect / 8s read transport limits and a 14s observable deadline (including
token acquisition). No writes or other module requests are replayed. A timeout
that might leave an underlying native request in flight is not retried.
Generation checks cancel scheduled retries and ignore results after logout.
Concurrent completion events share the same session-keyed completion promise;
session identity is checked again before navigation. No local profile is used
to grant access. Real profile failures still show the explicit retry action.

Web callback is now a single memoized promise after initialization, bounded by
a 15s error deadline rather than a 4s race returning a fake null result. The
parallel 6s watchdog, 2s account sleep and unauthenticated onboarding fallback
are removed. Account lookup follows callback completion. Backend context errors
cannot be interpreted as a successful onboarding/dashboard decision.

Run node scripts/test-auth-completion.mjs and the existing auth/deep-link/browser
suites. Coverage includes a 4.2s delayed web callback, single-flight load,
slow profile, bounded transient recovery, real 400/401/403/500 errors, malformed
context and logout while requests/retry are pending. Browser scenarios require
automatic Home for linked users after the first 503, with one SDK sign-in and
no intermediate error screen, and preserve explicit errors on permanent failure.

New [AUTH timing] logs contain only phase, elapsed milliseconds, status codes
and booleans, never tokens, OTP, account IDs or profile fields. Capacitor keeps
loggingBehavior none; the debug WebView console retains these timing messages.

Measured after installing the verified APK on emulator-5554 (data preserved),
the user confirmed a real OTP login reached Home on the first attempt. Debug
console timings: challenge 787ms, API token 323ms, profile stage 1021ms (includes
token acquisition), complete post-account phase 1051ms. Console timestamp delta
from authenticated challenge to completed navigation is 1052ms; total OTP-submit
to Home is approximately 1839ms. No retry/error appeared in that real run.
No instrumented production timing exists before the fix, so a real before/after
speedup is not claimed. Controlled 503 baseline required a manual retry; after
the fix the linked-user regression reached Home automatically in 335ms. Slow
API fixture (1200ms injected latency) completed automatically in about 1281ms.

## Contratto e confini

Repository: `C:\Dev\Gestionale`. Backend non modificato in questa fase.
Documenti correlati letti: 01-ruoli-contestuali-permessi,
07-autenticazione-api-external-id, 09-ios-capacitor-testflight e 10-auth-mobile-entra.
Regole applicate: identita da JWT validato, autorizzazione e CommunityId da `/api/me`,
nessuna autoassegnazione di ruoli, nessuna password custom o token in localStorage.

Web: MSAL Angular/Browser, loginRedirect/logoutRedirect, factory e scope base
openid/profile/email invariati. Native: Capacitor seleziona il bridge `EntraNativeAuth`.
La welcome screen approvata resta invariata. Accedi/Registrati aprono form in-app.

## SDK e bridge

- Android: Microsoft MSAL `com.microsoft.identity.client:msal:8.6.0`, API Native Auth
  stabili con coroutine Kotlin. Dipendenze esplicite, senza versioni wildcard.
  Il feed Microsoft Duo e limitato al gruppo display-mask richiesto da MSAL.
- iOS: Microsoft MSAL 2.17.0 via SPM, delegati Native Authentication.
  Deployment target iOS 17.0 richiesto dallo SDK. Nessuna configurazione Xcode
  manuale: package locale, storyboard e Face ID usage description sono versionati.
- Plugin locale npm `entra-native-auth-plugin` in `native/entra-native-auth`;
  prodotto SPM `EntraNativeAuthPlugin`, nome bridge `EntraNativeAuth`.
- Metodi: configure, start, submit, resend, restore, unlock, lock, cancel,
  logout, getAccessToken. Solo accessToken attraversa il bridge, mai refresh/ID token.

Configurazione pubblica riusa client eventi-app, tenant/subdomain eventidicomunita
e API scope `api://71a9f6da-a231-4285-b475-37d2e65b8fe1/access_as_user`.
Android Native SDK richiede authority tenant-domain:
`https://eventidicomunita.ciamlogin.com/eventidicomunita.onmicrosoft.com/`.
E lo stesso tenant; authority e configurazione MSAL web non sono cambiate.
iOS usa tenantSubdomain come previsto dal suo SDK. Non ci sono client secret.

## Flussi

Password: email/password -> SDK -> autenticato. OTP: pubblicizzare solo challenge
oob -> email -> codice -> SDK. La disponibilita e decisa dal user flow, non dalla UI.
Signup: email -> verifica codice -> password se richiesta -> attributi richiesti
dal server -> completamento e sign-in SDK. Nessun account viene creato dal backend.
Reset: codice -> nuova password -> completamento; iOS richiede un nuovo sign-in,
Android puo completare il sign-in tramite continuation SDK autorizzata.
Errori sanitizzati in italiano, nessun payload OAuth o dato sensibile nei log.
Password/codice vengono svuotati dal form dopo l'operazione e non persistiti.

Dopo autenticazione o sblocco: access token per API -> GET `/api/me` -> `/mobile/home`
se linkedToCommunity, altrimenti `/mobile/onboarding`. Il web conserva dashboard e
onboarding gestionali originali. Nessuna autenticazione derivata da
selectedCommunity o dati locali. Se /api/me fallisce, non si apre la dashboard.
L'interceptor trasmette Bearer solo all'origine API configurata, non a terze parti;
nessun ID token/header fiduciario. Nessun replay automatico delle scritture su 401.

## Post-login e home mobile

Bootstrap primo Responsabile: l'amministratore superiore configurato riceve
isOnboardingAdmin da /api/me anche se non associato. L'intestazione mobile offre
Appartenenze e approvazioni e la route /mobile/approvazioni non richiede membership
per questa capability. Home resta riservata a linkedToCommunity=true; nessun
cambiamento al login o al divieto di autoapprovazione. Procedura completa in docs/08.

Aggiornamento ruoli/approvazioni: vedere docs/01 e docs/08. Il form ordinario non
offre Catechista, seleziona comunita DB e mostra il riepilogo pending o rifiutato.
Verifica approvazione aggiorna /api/me e apre Home solo con linkedToCommunity=true.
Altro mostra Appartenenze e deleghe solo con permessi backend di approvazione;
Profilo consente di ricaricare le deleghe senza rifare il login. Card e quattro
tab restano invariati; calendario, compleanni, gruppi e avvisi restano placeholder.

La home Capacitor ha shell propria, senza sidebar desktop, header da `/api/me`,
card comunita/calendario/compleanni/gruppi/avvisi/convivenze e quattro tab inferiori:
Home, Calendario, Comunita, Altro. Profilo mostra solo dati del contesto backend;
Posti di convivenza compare solo con il permesso backend CREATE_CONVIVENZA.
Comunita, onboarding, convivenze e posti riusano i componenti e servizi esistenti.
Compleanni, gruppi, avvisi e calendario incontri mostrano stati di integrazione
non ancora disponibile: nessun dato o notifica fittizia. Calendario collega le convivenze.

Diagnosi locale senza credenziali: fetch WebView verso `/api/me` non otteneva una
risposta HTTP, mentre CapacitorHttp riceveva il previsto 401 anonimo. Il server
rispondeva al preflight OPTIONS con 204 e consentiva https://localhost, anche sul
GET 401: non e dimostrato un errore della policy CORS server. Il guasto osservato
e nel trasporto WebView. Le richieste JSON native all'origine/percorso API ora
usano CapacitorHttp nello stesso interceptor Bearer, senza seguire redirect HTTP.
Web, richieste terze, upload FormData e risposte binarie mantengono il trasporto esistente.
TLS e validazione JWT lato server non sono modificati.

Un errore transitorio `/api/me` non cancella piu la cache Entra: Riprova ripete la
verifica del profilo. Solo HTTP 401 continua a disconnettere. I log temporanei
tracciano esito OTP/account/token, scope pubblico, status HTTP e linked/status/route,
senza email, token o codici. Il login OTP reale richiede una nuova prova dell'utente:
il 200 /api/me e verificato nei test con bridge/API simulati, non con credenziali reali.

Verifiche di questa fase: 23 test auth, 19 scenari UI sulla build production,
incluse home Pixel/iPhone/Dynamic Island, Bearer e routing linked/unlinked.

## Cache, biometria e lifecycle

MSAL gestisce cache e refresh nativi: Android cache cifrata con chiavi Keystore,
iOS Keychain app-private. Non viene implementato un archivio token parallelo.
Android disabilita allowBackup per i dati app. Log bridge Capacitor disabilitati,
MSAL PII e logcat disabilitati, logging iOS `.nothing`.

Primo login: credenziali/codice Entra, non Face ID come primo fattore remoto.
Avvii successivi: restore restituisce solo presenza cache (unlock/login), senza token.
Unlock usa AndroidX BiometricPrompt o iOS LocalAuthentication con codice dispositivo
come alternativa OS. Non esiste un PIN app fittizio. Senza blocco OS disponibile,
o se l'utente annulla, puo eseguire un nuovo login Entra.

In background la sessione viene bloccata; il gate nativo protegge ogni estrazione
token, anche se un client JS tentasse di saltare la UI. Le acquisizioni concorrenti
JS condividono una singola Promise. Refresh/scadenza restano responsabilita MSAL.
Logout invalida transizioni pendenti, chiama signOut SDK e rimuove contesto /api/me.
Le risposte tardive non possono ripristinare una sessione JS disconnessa.
La cancellazione del form non equivale alla cancellazione della cache SDK.

## Fallback browser

Non si apre automaticamente il browser. Solo esito `fallback` dello SDK abilita
"Continua nel browser"; il click esplicito avvia AppAuth/PKCE preesistente.
Federazione Google/Apple e MFA non implementata dal bridge possono richiederlo.
Errori credenziali/rete generici non provocano fallback automatico.
Il fallback mantiene token solo in memoria (nessuna promessa di persistenza sicura);
dopo process death occorre nuovo accesso. Registrazioni dei redirect native-auth.json
e iOS esistenti restano necessarie per questo percorso. Nessuna modifica al tenant.

## Requisiti Entra da verificare nel portale

Tenant External ID corretto, app eventi-app associata al user flow corretto,
Native Authentication e public client flows abilitati (confermati dall'utente).
Controllare metodi realmente offerti dal user flow: email/password oppure email OTP,
attributi obbligatori e self-service password reset. Non tutti i flussi/metodi sono
combinabili nello stesso user flow; scegliere un metodo in UI non lo abilita nel tenant.
Verificare consenso dello scope API, redirect di fallback e firme debug/release/Play.
Con metodi federati o Conditional Access non supportati nativamente usare solo
il fallback esplicito, senza aggirare le policy. Non sono state modificate impostazioni
del portale e non e stata verificata l'associazione user flow tramite credenziali admin.

## Verifiche riproducibili

```powershell
cd C:\Dev\Gestionale
npm run test:auth-mobile
npm run build
# Node >=22 per Capacitor:
npx cap sync android
npx cap sync ios
npm run test:mobile-welcome
cd android
# JDK 21 compatibile con Gradle 8.14.3; Android Studio locale puo usare JDK 25.
.\gradlew.bat assembleDebug --console=plain
```

`test:auth-mobile` copre contratto SDK simulato, password/OTP/signup/reset,
biometric decision, cache lifecycle/logout, risposte tardive e test AppAuth/PKCE.
`test:mobile-welcome` usa Playwright su build production e bridge mock: viewport
Android/iOS, web preservato, form, Bearer `/api/me`, routing onboarding.
I test mock NON certificano il servizio Entra, Keychain/Keystore reali o biometria OS.

Esiti locali di questa implementazione: build Angular production riuscita
(warning preesistenti CSS/Leaflet/base64-js); TypeScript senza errori;
22 test auth passati e 17 scenari UI Playwright passati, senza errori runtime.
Sync Android e iOS riusciti; assembleDebug riuscito con JDK 21 temporaneo
(JDK 25 di Android Studio non compatibile con Gradle 8.14.3).
Sul Pixel emulato API 35: APK installato senza cancellare dati, plugin presente,
configure/restore SDK reali riusciti con cache vuota, click Accedi apre email e
password nella WebView e resta su `/`. Nessuna credenziale inserita, nessun OTP
inviato e nessun login reale completato. Nessuna verifica Xcode eseguita.
Backend invariato, quindi non sono stati eseguiti nuovi build/test backend.

Su Windows non si possono compilare/testare iOS, Face ID o Keychain con Xcode.
Usare il workflow macOS esistente per build/archive iOS e dispositivo reale/TestFlight.
Prima del rilascio provare entrambi gli OS: OTP vero, password, signup, reset,
attributi del tenant, annullamento/rete assente, restore dopo process death, biometria,
codice OS, refresh reale, background, logout e assenza cache dopo signOut.
Non inserire access token nei report o log, non simulare il superamento delle policy.

## Cambio account e cache Native Auth

Il cambio account usa signOut SDK, non cancel (che annulla solo il challenge).
Il servizio attende il logout prima del nuovo accesso, invalida token in volo e
contesto /api/me senza cancellare localStorage, preferenze o dati applicativi.
Il form rimane montato durante questa transizione. Ogni nuovo start richiede
cache SDK vuota; un errore account-already-signed-in provoca un solo retry dopo
signOut. Se la pulizia fallisce, il nuovo accesso non viene avviato.

Restore conserva la cache protetta e mostra Bentornato; unlock mantiene biometria
e credenziale dispositivo e verifica di poter acquisire il token. Una revoca
riconosciuta dal plugin Android o HTTP 401 ripulisce la sessione; un errore di
rete non cancella automaticamente l'account. iOS attende i callback SDK in corso
prima di completare signOut; Android verifica che l'account non sia piu presente.

Regressioni: npm run test:auth-mobile e npm run test:mobile-welcome (build richiesta).
I mock verificano ordine signOut/start, logout lento, restore/unlock e tre cicli
login/logout. OTP, biometria, process death e cache reali restano da provare su
dispositivo Android/iOS; la sync iOS su Windows non equivale a una build Xcode.

## Fonti ufficiali

La funzione dedicata "La mia comunita" usa ora /mobile/community e scheda mobile,
senza riutilizzare Comunita desktop. API e consensi: docs/12-mobile-community.md.

- https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-native-authentication-prepare-android-app
- https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-native-authentication-android-sign-up
- https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-native-authentication-android-self-service-password-reset
- https://github.com/AzureAD/microsoft-authentication-library-for-android/releases/tag/v8.6.0
- https://github.com/AzureAD/microsoft-authentication-library-for-objc/releases/tag/2.17.0
- https://developer.android.com/identity/sign-in/biometric-auth
- https://developer.apple.com/documentation/localauthentication
