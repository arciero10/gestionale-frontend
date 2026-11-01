# Native Authentication mobile

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

Dopo autenticazione o sblocco: access token per API -> GET `/api/me` -> dashboard
se linkedToCommunity, altrimenti onboarding. Nessuna autenticazione derivata da
selectedCommunity o dati locali. Se /api/me fallisce, non si apre la dashboard.
L'interceptor trasmette Bearer solo all'origine API configurata, non a terze parti;
nessun ID token/header fiduciario. Nessun replay automatico delle scritture su 401.

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

## Fonti ufficiali

- https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-native-authentication-prepare-android-app
- https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-native-authentication-android-sign-up
- https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-native-authentication-android-self-service-password-reset
- https://github.com/AzureAD/microsoft-authentication-library-for-android/releases/tag/v8.6.0
- https://github.com/AzureAD/microsoft-authentication-library-for-objc/releases/tag/2.17.0
- https://developer.android.com/identity/sign-in/biometric-auth
- https://developer.apple.com/documentation/localauthentication
