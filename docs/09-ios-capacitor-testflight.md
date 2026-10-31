# Eventi di Comunita: iOS, Android e TestFlight

## Stato e architettura

Repository operativo: `C:\Dev\Gestionale`. Non usare copie Desktop/OneDrive.
Questa fase prepara i contenitori nativi; non certifica login mobile, firma,
upload Apple o funzionamento su dispositivo. Nessun backend e stato modificato.

- Nome pubblico: Eventi di Comunità. Organizzazione Apple: PANTELEIA - APS.
- Bundle ID iOS e applicationId Android: `it.panteleia.eventidicomunita`.
- Capacitor core, CLI, iOS e Android: 8.6.0, versioni esatte nel lockfile.
- Angular 20 e dipendenze applicative non aggiornate.
- `capacitor.config.ts`: `webDir = dist/avalon-ng/browser`.
- Angular usa `@angular/build:application`, outputPath `dist/avalon-ng`;
  il risultato verificato contiene index.html nella sottocartella browser.
- Nessun server.url: Angular e asset sono inclusi nella app, non caricati
  dal sito test. Le richieste API restano HTTPS verso Azure.
- API pubblica e scope vengono letti dal api-config.json incluso nel bundle,
  con gli environment esistenti come fallback. Non e configurazione segreta.
- Nessun service worker/ngsw/PWA configurato nel progetto attuale.
- iOS usa Swift Package Manager (SPM), non richiede pod install.
- Target iOS 15.0, marketing version 1.0 e build 1: valori generati dal
  template Capacitor 8.6.0, non target scelti arbitrariamente.
- Android conserva SDK/Gradle e versione 1.0/code 1 del template ufficiale.

## Prerequisiti e comandi Windows

Capacitor 8 richiede Node >=22. Il sistema esaminato aveva Node 20.19.6:
installare Node 22 LTS prima dei normali comandi seguenti. Non e stato cambiato
il Node di sistema. In questa verifica e stato usato Node 22.23.4 isolato
tramite npm exec per eseguire la CLI Capacitor.

```powershell
cd C:\Dev\Gestionale
node --version
npm ci
npm run build
npx cap sync ios
npx cap sync android
# Oppure build e sync in un comando:
npm run build:ios
npm run build:android
```

Con Node 20, per il solo sync senza cambiare installazione globale:

```powershell
npm exec --yes --package=node@22 -- node node_modules/@capacitor/cli/bin/capacitor sync ios
```

ios/ e android/ vanno versionate. Gli asset copiati e config native generate
dal sync sono ignorati: CI li ricrea con npm ci, build e sync. Non ignorare
gradle-wrapper.jar: il wrapper Android e necessario a build riproducibili.
I certificati, profili, chiavi, cache IDE, binari di build e local.properties
non devono essere versionati. Non eseguire Xcode/pod/open ios su Windows.
Android richiedera Android Studio, SDK e JDK compatibili con il template per
una build APK/AAB; non sono stati installati o eseguiti in questo intervento.

## Routing e login: limite esplicito di questa fase

Il routing Angular rimane path-based, con base href /, senza HashLocationStrategy
o modifica degli URL web. Capacitor serve i file localmente. Le route interne
restano quelle esistenti. Universal Links/App Links esterni non sono configurati:
richiedono dominio, associazioni e gestione URL nativa prima di poterli testare.

MSAL Browser/Angular esistente usa:

- authority External ID eventidicomunita.ciamlogin.com e tenant gia configurato;
- redirect login/logout `window.location.origin`;
- cache BrowserCacheLocation.LocalStorage;
- callback/handleRedirectObservable e interceptor invariati;
- scope API reale gia presente (nessun secret nella SPA).

In WKWebView l'origine predefinita e capacitor://localhost, non uno dei redirect
SPA HTTPS registrati. Il redirect web non e quindi un login mobile funzionante;
possono inoltre mancare requisiti browser come secure context/Web Crypto.
Non registrare un redirect inventato e non usare server.url verso il sito per
aggirare il problema. Non copiare token da Safari o dal localStorage web.

Prima di una beta autenticata bisogna scegliere e integrare un percorso mobile
supportato (MSAL nativo/bridge verificato con browser di sistema), configurare
la piattaforma mobile nella registrazione Entra, usare il redirect effettivo
fornito dalla configurazione scelta, gestire il ritorno nativo e token API.
MSAL web rimane per il browser. Browser di sistema e WebView non condividono
automaticamente cache/sessione; nessun token va in querystring o log.
Il flusso OTP, logout, refresh token e autorizzazione /api/me vanno verificati
su dispositivo prima di considerare la app pronta per gli utenti.

Il backend deve autorizzare con JWT come oggi. Verificare in test CORS per le
origini native effettive (iOS capacitor://localhost, Android https://localhost),
senza disabilitare globalmente CORS o validazione token. Nessuna modifica backend
e stata fatta. Le funzionalita pubbliche/demo possono essere usate per smoke test.

## Workflow manuale iOS

File: `.github/workflows/ios-testflight.yml`. Nessun trigger push/PR.
In GitHub Actions selezionare il workflow e Run workflow su main.

- Default publish_testflight=false: npm ci, build Angular, sync iOS, risoluzione
  SPM e build Release per simulatore non firmata. Non usa Secrets e non carica.
- Il runner macos-latest seleziona una Xcode stabile >=26 presente; se assente
  fallisce con errore chiaro. Questo e un requisito Capacitor 8.
- publish_testflight=true: verifica Secrets, importa il certificato in keychain
  temporaneo, installa profilo, archive Release per dispositivo, export IPA e
  upload con App Store Connect API key. Pulisce le credenziali anche su errore.
- Non e stato eseguito questo workflow da Windows; archive/upload richiedono
  il runner macOS e asset Apple reali. Non e una promessa di approvazione Apple.

Secrets del repository (non variabili nel codice):

| Secret | Contenuto |
| --- | --- |
| APPLE_TEAM_ID | Team ID reale dell'organizzazione, non il nome pubblico |
| APP_STORE_CONNECT_KEY_ID | ID chiave App Store Connect autorizzata all'upload |
| APP_STORE_CONNECT_ISSUER_ID | Issuer ID reale |
| APP_STORE_CONNECT_PRIVATE_KEY | Testo completo .p8, con newline |
| IOS_CERTIFICATE_BASE64 | .p12 Apple Distribution codificato base64, chiave privata inclusa |
| IOS_CERTIFICATE_PASSWORD | Password reale del .p12 |
| IOS_PROVISIONING_PROFILE_BASE64 | Profilo App Store Connect per Bundle ID/Team corretti |

La API key autorizza l'upload, non sostituisce automaticamente certificato e
profilo di firma. Si usa firma manuale esplicita per non presumere che il
runner possa generare certificati o profili con automatic signing.
Limitare accesso ai Secrets e alle persone autorizzate a eseguire il workflow.

Inserire un build_number intero positivo diverso da ogni build gia caricata.
Il progetto parte da 1; il workflow sovrascrive CURRENT_PROJECT_VERSION durante
la build, senza commit automatici. Marketing version resta 1.0; per cambiarla
aggiornare entrambi i MARKETING_VERSION in project.pbxproj. Android usa invece
versionCode/versionName in android/app/build.gradle.

## Apple, push e distribuzione ancora da completare

Su Apple verificare certificato Distribution, profilo compatibile, Team ID,
ruolo API key e corrispondenza Bundle ID con la scheda App Store Connect gia
creata. Completare icona definitiva, privacy manifest dove richiesto, App Privacy,
export compliance, descrizione beta e informazioni revisore. I template possono
contenere icone/splash di esempio: non sono branding finale per App Store.

La capability Push Notifications predisposta nel portale non basta per ricevere
push: non sono stati aggiunti entitlements, plugin o backend APNs. Prossimo passo:
@capacitor/push-notifications compatibile, gestione consenso e token dispositivo,
entitlement aps-environment e profilo aggiornato, credenziali APNs lato server
e associazione sicura utente-dispositivo. Non mettere chiavi APNs nel client.

Dopo upload attendere processing Apple, risolvere eventuali richieste compliance,
aggiungere tester interni. Per esterni puo servire Beta App Review. Il tester
installa TestFlight da App Store e accetta l'invito; non serve possedere un Mac.
Il runner macOS non sostituisce test reali su iPhone, specialmente auth e push.

## Fonti ufficiali

- https://capacitorjs.com/docs/getting-started/environment-setup
- https://capacitorjs.com/docs/config
- https://capacitorjs.com/docs/ios
- https://learn.microsoft.com/en-us/entra/msal/objc/customize-webviews

Documento progetto letto: docs/07-autenticazione-api-external-id.md.
Applicati separazione identita/autorizzazione, nessun nuovo redirect o secret,
nessuna modifica al flusso web funzionante o alla sorgente backend dei ruoli.

## Verifiche eseguite su Windows

npm ci con Node 22 riuscito; build Angular production riuscita; add e sync di
entrambe le piattaforme riusciti. Index Angular e copie iOS/Android identici.
Workflow YAML caricato e blocchi Bash controllati sintatticamente, ma non
eseguiti su macOS. Nessuna build nativa o upload TestFlight effettuati.

Il lockfile conserva Angular e MSAL. La nuova CLI richiede anche un aggiornamento
transitivo minipass da 7.1.2 a 7.1.3. Nessun audit fix/upgrade generale eseguito.
npm ci segnala 57 vulnerabilita (2 basse, 15 moderate, 37 alte, 3 critiche):
richiedono revisione separata e non vengono dichiarate risolte da Capacitor.
Restano i warning Angular sui budget CSS e Leaflet CommonJS.
La prima esecuzione standard di npm run build e riuscita. Dopo npm ci, alcune
ripetizioni locali uscivano senza diagnostica; la verifica finale nello stesso
output e riuscita con `npm run build -- --progress=false --delete-output-path=false`.
Il workaround non e stato applicato agli script o alla configurazione web/CI;
il runner GitHub usa un checkout pulito. Il comando build:ios completo va
riverificato sul runner; build Angular e sync sono stati verificati separatamente.
