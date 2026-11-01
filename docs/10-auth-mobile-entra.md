# Autenticazione web, iOS e Android con Entra External ID

## Stato verificato

Implementazione preparata in C:\Dev\Gestionale, backend C:\Dev\GestionaleApiClean.
Non e stato eseguito login su iPhone, emulatore o dispositivo Android. Non
dichiarare la funzionalita pronta prima dei test fisici e della registrazione
dei redirect reali. Il backend continua a essere la fonte autorevole dei ruoli.

Documenti letti: 01-ruoli-contestuali-permessi, 07-autenticazione-api-external-id,
09-ios-capacitor-testflight. Applicati identita da JWT, ruolo contestuale da API,
nessuna autoassegnazione, nessun token in storage persistente mobile.
Questo documento sostituisce la precedente nota di 09 sul login non implementato.

## Configurazione unica

`src/app/auth/entra-settings.ts` centralizza i valori Entra e il redirect iOS.
app.config.ts li ri-esporta per compatibilita: la factory MSAL web e invariata.

| Dato | Valore |
| --- | --- |
| SPA/public client eventi-app | 21ee1eae-67e3-4c7c-86ab-db78994d8666 |
| Tenant External ID | 069bb457-b363-4340-8086-d7dd3b60a2b5 |
| Authority | https://eventidicomunita.ciamlogin.com/069bb457-b363-4340-8086-d7dd3b60a2b5 |
| API audience | 71a9f6da-a231-4285-b475-37d2e65b8fe1 |
| API scope | api://71a9f6da-a231-4285-b475-37d2e65b8fe1/access_as_user |
| Bundle/package | it.panteleia.eventidicomunita |
| iOS redirect | msauth.it.panteleia.eventidicomunita://auth |
| Android redirect debug | Configurato in public/native-auth.json con il valore reale fornito |

Lo scope API resta nella configurazione runtime gia esistente api-config.json
con fallback environment; non viene sostituito da uno scope mobile inventato.

## Architettura e librerie

AuthService e il punto di accesso dell'app. MobileAuthService seleziona native
soltanto per Capacitor ios/android; web usa ancora MSAL Angular/Browser con
loginRedirect e logoutRedirect, scope base openid/profile/email e localStorage
MSAL. L'interceptor PlatformAuthInterceptor delega al medesimo MsalInterceptor
sul web; il bootstrap web, redirect e watchdog seguono il codice preesistente.
MSAL viene risolto pigramente, non inizializzato sulla WebView mobile.

Native usa @capacitor/app 8.1.2, @capacitor/browser 8.0.5 e CapacitorHttp core.
AppAuth-JS (@openid/appauth 1.4.0) genera PKCE e rappresenta le richieste OAuth
e lo scambio token. @noble/hashes 2.4.0 fornisce SHA-256 tramite adattatore crypto
AppAuth per WKWebView senza SubtleCrypto. Nessun algoritmo SHA scritto a mano,
nessuna degradazione PKCE plain o Math.random: senza getRandomValues si blocca.

Valutati e non mantenuti nel progetto: generic-oauth2 7.x (dipendenza SPM
Capacitor 7, incompatibile con 8) e capgo/social-login 8.x (token in
UserDefaults/SharedPreferences non cifrati). Non sono dipendenze finali.

Browser.open usa SFSafariViewController su iOS e Custom Tabs su Android: UI
browser controllata dal sistema, non una pagina Microsoft nella WebView Angular.
Non e MSAL nativo/broker e non viene dichiarato ASWebAuthenticationSession.
Eventuali requisiti futuri di broker/Conditional Access richiedono valutazione
MSAL nativa separata; non vengono simulati qui.

## Flusso native, PKCE e callback

1. Accedi/Registrati avvia lo stesso flusso interattivo External ID.
2. Discovery HTTPS sulla authority esistente; endpoint authorization/token
   ammessi solo sullo stesso host e percorso tenant. Verificati anche contro
   la metadata pubblica reale durante l'implementazione.
3. AppAuth crea state casuale e verifier; S256 e obbligatorio. La richiesta
   richiede code, openid profile email offline_access e lo scope API reale.
4. Prima di Browser.open sono installati appUrlOpen e browserFinished.
5. Callback: confronto esatto scheme/host/path, niente userinfo o fragment,
   un solo state uguale alla transazione e un solo code. Callback doppio ignorato.
6. Scambio nativo HTTP form-urlencoded senza Origin SPA, senza secret, con
   verifier. Solo access_token puo diventare Bearer, mai id_token.
7. Angular chiama /api/me con Bearer; solo dopo risposta autenticata si apre
   dashboard se linkedToCommunity=true, altrimenti onboarding.
8. Browser iOS chiuso al ritorno. Android riconsegna il callback tramite
   singleTask MainActivity e App plugin; Browser.close non e supportato su
   Android, quindi non viene chiamato. Il ritorno al foreground senza callback
   cancella la transazione dopo 2 secondi di tolleranza; timeout totale 5 minuti.

La transazione non e persistita. Callback dopo process death e rifiutato e
richiede un nuovo accesso. Un logout durante exchange/refresh invalida la
generazione; una risposta in ritardo non puo ricreare la sessione.
ID token non viene usato come identita locale autorevole: identita e permessi
vengono dal backend /api/me. Nessun header X-Forwarded-* viene introdotto.

## Token lifecycle, storage e logout

Access/refresh token e verifier sono SOLO in memoria JS del processo. Non si
usano localStorage, sessionStorage, Preferences, UserDefaults o file per token.
Non e uno storage Keychain/Keystore: la persistenza sicura NON e implementata.
Terminare il processo comporta un nuovo login. Proteggere comunque la WebView
da XSS: memoria non significa isolamento dai JavaScript della stessa origine.

Token valido viene riusato; a meno di 60 secondi dalla scadenza viene tentato
un refresh condiviso tra chiamate concorrenti, se disponibile. Refresh token
ruotato sostituisce il precedente. Senza refresh o con errore la sessione si
chiude e serve un nuovo login. Nessun replay automatico di POST dopo 401.
L'interceptor invia Bearer solo alla origine API configurata, mai a terze parti.

Logout elimina token, stato PKCE e contesto /api/me, e ritorna alla login.
E un logout locale mobile: non cancella i cookie SSO del browser Microsoft.
Il login successivo richiede select_account. Il logout web resta invariato.
`loggingBehavior: none` in capacitor.config.ts evita log bridge con token/URL;
AppAuth logging disabilitato. Non loggare risposte OAuth, codici o token.

L'origine localhost nativa non abilita il vecchio mock amministratore localhost;
la regola web localhost resta invariata. I permessi reali sono sempre controllati
dal server, non dai controlli visivi o dalle liste email mock preesistenti.

## Configurare Entra manualmente

Nel tenant esterno corretto, App registrations > eventi-app (Client ID sopra):

1. Conservare piattaforma SPA e redirect web esistenti localhost:4200 e
   https://test.eventidicomunita.it. Non aggiungere capacitor://localhost come SPA.
2. Authentication > Add platform > iOS/macOS, Bundle ID esatto sopra.
   Confermare il redirect generato msauth.it.panteleia.eventidicomunita://auth.
   Info.plist contiene gia CFBundleURLTypes/CFBundleURLSchemes corrispondente.
3. Add platform > Android con package esatto e signature hash REALE della
   firma usata. Copiare il redirect generato dal portale, con escaping intatto.
4. Authentication > Advanced settings: seguire la quickstart Microsoft per
   client mobile External ID, Allow public client flows = Yes. Non abilitare
   implicit grant e non creare client secret. Il codice implementa soltanto
   authorization code+PKCE e refresh, non ROPC/device code/password grant.
5. Conservare il permesso delegato API access_as_user e consenso amministratore
   gia concesso. Verificare eventi-app associata al corretto user flow External ID
   e Email OTP; non creare policy B2C, non cambiare tenant/authority/audience.

Non sono state eseguite modifiche automatiche al tenant. La registrazione mobile
deve essere completata nel portale PRIMA del test su dispositivo.

## Android: un solo punto di configurazione

Inserire il redirect Android reale in `public/native-auth.json`, campo
androidRedirectUri. Il valore debug reale e gia configurato. Una stringa vuota
indica configurazione mancante, non un hash dimostrativo.

android/app/build.gradle legge lo stesso JSON e valida scheme/package/hash;
decodifica il path via URI e imposta entraRedirectPath nel manifest. Il filtro
VIEW/BROWSABLE e sulla MainActivity singleTask. Senza config il path e
/__NOT_CONFIGURED__: un segnaposto disabilitato, non un redirect registrato.
Non sostituirlo manualmente nel manifest; compilare sempre il JSON prima di
build Angular/sync/Gradle. Non serve una seconda activity MSAL per questo flusso.

Per debug/release/Play selezionare il valore corrispondente prima della build;
ogni firma richiede un redirect registrato e una app ricompilata coerentemente.
Nessun keystore e stato creato, letto o committato durante questo task.

### Generare gli hash in PowerShell senza pipeline binarie

Prerequisiti JDK/keytool e SDK Android configurati. Verificare prima il keystore:

```powershell
$debugKeystore = Join-Path $env:USERPROFILE '.android\debug.keystore'
Test-Path -LiteralPath $debugKeystore
```

Se manca, Android Studio o una build debug Gradle lo genera con il tooling
installato: dalla root eseguire `android\gradlew.bat -p android :app:assembleDebug`.
Verificare poi il percorso effettivo (puo cambiare con user home/tooling).
Non creare una firma casuale da usare come presunta firma Google Play.

```powershell
function Get-EntraSigningHash([string]$Keystore, [string]$Alias) {
  if (!(Test-Path -LiteralPath $Keystore)) { throw 'Keystore non trovato' }
  $der = [IO.Path]::GetTempFileName()
  try {
    & keytool -exportcert -keystore $Keystore -alias $Alias -file $der
    if ($LASTEXITCODE -ne 0) { throw 'Esportazione certificato fallita' }
    $sha1 = [Security.Cryptography.SHA1]::Create()
    try { [Convert]::ToBase64String($sha1.ComputeHash([IO.File]::ReadAllBytes($der))) }
    finally { $sha1.Dispose() }
  } finally { Remove-Item -LiteralPath $der -ErrorAction SilentlyContinue }
}
Get-EntraSigningHash -Keystore $debugKeystore -Alias 'androiddebugkey'
```

keytool chiede la password in modo interattivo (default debug del tooling:
android). Non salvare password release negli script. SHA-1 e usato qui SOLO per
il formato identificatore firma richiesto da Microsoft, non per PKCE o password.

- DEBUG: hash del certificato debug realmente usato per l'APK installato.
- RELEASE fuori Play: stessa funzione con keystore e alias Distribution reali.
- GOOGLE PLAY: App integrity > App signing, scaricare il certificato DER della
  app signing key. Non confonderlo con l'upload key. Calcolare Base64(SHA1(DER)):

```powershell
$certificatePath = Read-Host 'Percorso certificato DER scaricato da Play'
$sha1 = [Security.Cryptography.SHA1]::Create()
try { [Convert]::ToBase64String($sha1.ComputeHash([IO.File]::ReadAllBytes($certificatePath))) }
finally { $sha1.Dispose() }
```

Inserire l'hash nel portale Entra; nel JSON copiare il redirect generato (non
comporlo con stringhe non escaped). Il manifest usa il path decodificato mentre
l'authorize/token request usa la redirect URI registrata. Gestire anche eventuale
rotazione della Play app signing key, registrando i certificati effettivamente usati.

## Backend e CORS

Unica modifica backend Program.cs: allowlist CORS aggiunge capacitor://localhost
e https://localhost. Nessun wildcard, nessun cambiamento a JWT/ProxyTrust.
Serve deploy backend per rendere operative le chiamate Angular dalle WebView.
Issuer/firma/tenant/audience/scp restano verificati: token ottenuti dal public
client mobile per la medesima API non richiedono un nuovo schema di autenticazione.
GET /api/me resta protetto da JWT, non da header fiduciari o ID token.

## Test e limiti residui

```powershell
cd C:\Dev\Gestionale
npm run test:auth-mobile
npm run build
# Node 22+ richiesto dai seguenti comandi:
npx cap sync ios
npx cap sync android
cd C:\Dev\GestionaleApiClean
dotnet build .\Gestionale.csproj
dotnet test .\Gestionale.csproj
dotnet run --project .\Tests\Identity\IdentityChecks.csproj
```

Test frontend indipendenti da browser reale: piattaforma, URI callback, state,
PKCE S256 senza SubtleCrypto, doppio callback, access vs ID token, lifecycle,
refresh condiviso, scadenza e logout durante exchange. TestRunner esbuild
compila solo il motore puro in una cartella temporanea, poi Node test la elimina.
dotnet test sul progetto API non scopre suite xUnit: i 35 controlli effettivi
sono nel programma eseguibile Tests/Identity, che va lanciato separatamente.

Esiti locali: 14 test frontend passati, controllo TypeScript riuscito, factory
MSAL web confrontate identiche normalizzando soltanto CRLF, build production
Angular riuscita e sync iOS/Android riusciti. Prima build standard riuscita;
alcune ripetizioni locali uscivano senza diagnostica. L'ultima build completa
e riuscita con NG_DEBUG=true e `--progress=false --delete-output-path=false`,
senza modificare script/config web. Restano warning CSS/Leaflet e il nuovo
warning CommonJS base64-js usato da AppAuth. npm audit segnala 56 vulnerabilita
nelle dipendenze complessive: non e stato eseguito un audit fix generale.
Backend build riuscita (warning preesistenti), dotnet test exit 0 e 35 controlli
Identity passati dopo la modifica CORS. Nessun test OTP remoto reale effettuato.

iOS su build macOS/TestFlight: controllare browser esterno, OTP, callback,
browser chiuso, /api/me, onboarding e approvazione, dashboard, logout, nuovo
accesso, annullamento e rete assente. Android: prima configurare firma/redirect,
poi gli stessi test su debug e build Play reale; provare back, doppio callback,
ritorno dopo timeout e process death. Nessun bypass della validazione per test.

Non ancora completati su dispositivo: callback/Safari/Custom Tabs, login OTP reale,
token refresh reale, process death e integrazione del filtro manifest nel build
Gradle/Xcode. CORS va verificato dopo deploy. Gli errori sono presentati in
italiano senza dettagli OAuth grezzi. Storage sicuro persistente resta una fase
successiva: Keychain/Keystore verificato prima di introdurre restore di sessione.

## File principali

Frontend: entra-settings.ts, mobile-auth-core.ts, mobile-auth.service.ts,
platform-auth.interceptor.ts, AuthService, gestionale-auth.guard.ts, app.ts,
app.config.ts (sola selezione interceptor/costanti), platform-admin.mock.ts,
capacitor.config.ts, public/native-auth.json, Info.plist, manifest/build.gradle,
file SPM/Gradle generati dal sync, package/lock, tests e script runner.
Backend: solo Program.cs. Nessuna migration o modifica DB.

## Diagnosi runtime Android: WebView Chromium 124

Sul Pixel 9 API 35 emulato e stata osservata direttamente la WebView reale
(Chrome/124.0.6367.219) tramite DevTools, senza leggere token, codici o email.
fetch /native-auth.json restituisce 200, la chiave androidRedirectUri esiste
e il valore letto e quello esatto configurato. document.baseURI e
https://localhost/: sia il vecchio path assoluto sia il nuovo path relativo
risolvono a https://localhost/native-auth.json. Il file NON mancava.

Il difetto era nel parser per schemi non standard della WebView: new URL del
redirect msauth restituisce hostname vuoto e pathname che contiene anche
//it.panteleia.eventidicomunita. Il controllo host/hash quindi rifiutava un URI
valido e il catch globale lo etichettava come configurazione assente.

parseMobileUri separa lo schema e usa il parser HTTPS soltanto per ispezionare
authority/query, conservando il path codificato originale. Host, scheme,
credenziali/porte, state e firma restano controllati; nessuna URI registrata o
token request viene ricostruita. Anche la validazione callback usa lo stesso
parser, per evitare il medesimo problema dopo il ritorno dal browser.

native-auth-config.ts carica new URL('native-auth.json', document.baseURI),
verifica HTTP/JSON/shape e distingue redirect mancante da redirect invalido.
Il servizio mantiene soltanto warning essenziali con codici di errore fissi,
senza payload, URL OAuth, token, verifier o dati personali. Gli errori dei plugin
non vengono piu descritti come configurazione mancante. getLaunchUrl vuoto e
gestito difensivamente. Nessuna configurazione Entra o backend modificata.

La lettura del loader corretto e stata verificata nella WebView Chrome 124 con
il redirect debug invariato. Aggiunti test di caricamento relativo, hash con
%2F/%3D, parser opaco legacy, errori config distinti e invarianza iOS.
Anche l'APK aggiornato e stato installato sul Pixel emulato mantenendo i dati:
il click reale Accedi ora attraversa config HTTP 200, getLaunchUrl, discovery
HTTP nativa e Browser.open, senza errore di configurazione. Non sono state
inserite credenziali o completato OTP; callback/token exchange reale restano
da verificare con l'utente. Le sonde runtime erano solo in memoria/DevTools,
non nel bundle finale; nessun log di token, codici, verifier o dati personali.

## Riferimenti

- https://github.com/openid/AppAuth-JS
- https://capacitorjs.com/docs/apis/browser
- https://capacitorjs.com/docs/apis/app
- https://capacitorjs.com/docs/apis/http
- https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow
- https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-mobile-app-sign-in
- https://learn.microsoft.com/en-us/entra/msal/android/frequently-asked-questions
