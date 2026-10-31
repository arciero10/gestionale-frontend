# Apertura mobile Eventi di Comunita

## Perimetro

Nuovo componente standalone MobileWelcome in src/app/auth/mobile-welcome.ts,
con template HTML e SCSS separati. App lo mostra solo nel ramo showLogin e
quando MobileAuthService.native e true (Capacitor ios/android). Il ramo web,
anche in browser su telefono, conserva il markup e gli stili precedenti.
Non sono cambiati backend, token, API, OAuth, Entra, native-auth.json,
configurazione Capacitor, firma Android, routing o workflow iOS.

Documentazione letta: 10-auth-mobile-entra.md. La UI riusa il flusso condiviso:
output access -> App.login -> AuthService.loginNative; output registration ->
App.register -> lo stesso flusso External ID gia implementato. Nessuna copia
del protocollo o nuovo endpoint. Demo e FAQ usano RouterLink /demo e /faq.

## Immagine e layout

Foto originale non modificata: src/assets/images/login-bg.jpg. Nessuna immagine
generata o screenshot di mockup. Immagine full-bleed con object-fit cover,
ritaglio orientato a sinistra per mantenere visibile Giovanni Paolo II; overlay
piu trasparente nella zona centrale. Il ritaglio portrait non puo contenere
tutti i soggetti della fotografia orizzontale: priorita al volto del Papa.

Titolo Eventi di Comunita e payoff sono testo reale. Card inferiore glass con
fallback opaco se backdrop-filter non e disponibile. Pulsanti da 52 px,
link da almeno 44 px, focus visibile, icone PrimeIcons gia installate decorative
e nascoste agli screen reader. Nessun nuovo font o risorsa remota.

Altezza minima 100dvh con fallback 100vh; su viewport molto basse e ammesso
scroll. Safe area top/bottom/left/right via env(). Solo durante la presenza
del componente nativo si aggiunge viewport-fit=cover al meta viewport; il
contenuto originale e ripristinato alla distruzione. L'index.html web e invariato.

## Verifiche riproducibili

```powershell
cd C:\Dev\Gestionale
npm run build
npm run test:auth-mobile
npm run test:mobile-welcome
# Con Node 22+:
npx cap sync android
npx cap sync ios
```

Il test UI richiede Playwright come tooling di sviluppo disponibile al resolver
Node (installazione locale di test o NODE_PATH del runtime di sviluppo). Non e
una dipendenza runtime dell'app e non e stato aggiunto alla app mobile.
Su Windows usa Edge headless, altrove Chromium di Playwright. PLAYWRIGHT_CHANNEL
permette di scegliere un canale disponibile. Il test avvia un server statico su
porta temporanea e lo chiude insieme al browser: non lascia servizi attivi.

La piattaforma Capacitor e i metodi App/Browser sono simulati SOLO nel test,
prima del bootstrap. Nessun OTP, token o modifica al tenant. Si verifica che
Accedi e Registrati chiamino Browser.open attraverso il percorso applicativo
esistente, non il completamento di un login Microsoft reale.

Viewport testate e screenshot in dist/mobile-welcome-check (non versionati):

- Pixel 9: 412x915, Android con inset simulati.
- Android medio: 360x800.
- iPhone standard: 390x844, safe area 47/34.
- iPhone Dynamic Island: 393x852, safe area 59/34.
- Stretto: 320x568.
- Tablet: 768x1024.
- Landscape basso: 740x360, scroll controllato.
- Browser non nativo: 1280x900 e 390x900, vecchia landing invariata.

Controlli: nessun overflow orizzontale, nessuna sovrapposizione tra header,
card e footer, pulsanti >=48 px, safe area, niente scroll superfluo nei casi
verticali, foto decodificata, nessun errore runtime nelle viste native,
navigazione Demo/FAQ e collegamenti Accedi/Registrati. Screenshot ispezionati
per il ritaglio della fotografia, incluso iPhone Dynamic Island e device stretto.
Questi sono test browser della UI nativa simulata, non esecuzioni Android 15
o iOS reali. Resta necessario un controllo su device fisico per gli inset effettivi.

## Android locale

JDK Android Studio e SDK gia disponibili; nessuna configurazione di firma cambiata.

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd C:\Dev\Gestionale\android
.\gradlew.bat assembleDebug --console=plain
```

APK generato in android/app/build/outputs/apk/debug/app-debug.apk (ignorato da Git).
Non e stato avviato automaticamente un emulatore o testato OTP su dispositivo.
La mancanza del signature hash Android in native-auth.json resta il limite
documentato nel task auth precedente e non viene aggirata da questa UI.

Esito finale: npm run build riuscito, sync Android e iOS riusciti, assembleDebug
riuscito e APK verificato contenere l'index della build finale. Passati i 13 casi
del test UI e i 10 test auth esistenti. Restano i warning preesistenti Angular
(CSS, Leaflet/base64-js) e Gradle flatDir; nessun nuovo errore di budget CSS.
