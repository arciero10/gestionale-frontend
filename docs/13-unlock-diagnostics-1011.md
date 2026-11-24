# Diagnosi sblocco 1010 e build diagnostica 1011

## Evidenze e limiti

L'utente ha confermato Home V5 su iPhone con 1010. Ha segnalato lentezza dopo
Face ID e rifiuti intermittenti risolti dal tentativo manuale. Non abbiamo
una traccia del dispositivo che identifichi HTTP 401/403, token o lifecycle.
Nessuna causa di questi rifiuti viene dichiarata verificata tramite soli mock.

Il codice 1010 effettua un'acquisizione silenziosa SDK prima di /api/me;
non forza un refresh. /api/me e' obbligatorio per ricostituire autorizzazioni.
I token delle chiamate Home concorrenti condividono la promise in volo.
Un background invalida il contesto; le risposte tardive non lo riabilitano.
La disiscrizione RxJS non interrompe il trasporto Capacitor Promise: puo'
lasciare una richiesta nativa in volo, ma non deve autorizzare la UI.

## Diagnostica locale

- Un UUID casuale per tentativo, non derivato da identita' o account.
- Solo memoria del processo: tentativo corrente e precedente, massimo 80
  eventi per tentativo. Nessun invio automatico di telemetria o persistenza.
- Solo fasi, categorie allowlisted, durate monotone e status HTTP.
- Niente URL, payload, nomi, email, ruoli, ID account, token o messaggi SDK.
- Su errore e sul Benvenuto: aprire `Diagnostica accesso`.
  Dopo un accesso riuscito, tornare al Benvenuto per leggere la stessa traccia.
  `atMs` e' il tempo dall'inizio tentativo; `elapsedMs` la durata della fase.
  Gli eventi http/profile `started` contano le richieste effettivamente avviate.
  Gli eventi `retry` NON sono nuove richieste finche' non compare `started`.
- Misure distinte: inizializzazione, restore/cache, LocalAuthentication,
  attesa attivazione UIKit, unlock, token silenzioso, trasporto profilo,
  contesto, navigazione, HTTP successivi e background/foreground.
- Il totale access include attese precedenti: non sommare durate
  sovrapposte. context misura validazione/pubblicazione della risposta.
  L'evento context precede la navigazione; navigation misura il
  Router, non promette il tempo del primo frame fisico sul display.
- La durata token include l'eventuale refresh gestito da MSAL. L'API pubblica
  MSALResult non espone una sorgente cache/rete: NON deduciamo refresh da una
  semplice durata. Non attiviamo log SDK completi o intercettazioni TLS.
  Fonte: https://azuread.github.io/microsoft-authentication-library-for-objc/Classes/MSALResult.html
- La decodifica locale del JWT resta solo diagnostica (formato, audience,
  scope, scadenza categorizzati): NON valida JWT e NON concede accesso.

## Interventi circoscritti

NSURLErrorCancelled (-999) e' distinto da CONNECTIVITY/NETWORK: non viene
ritentato come errore di rete. HTTP 401/403, TLS e payload non valido non
vengono ritentati automaticamente. Il retry esistente (massimo uno) resta
limitato a GET con errore di trasporto completato o HTTP 502/503/504.
Timeout Angular non avvia una seconda richiesta nativa ancora in volo.
Le operazioni dell'interceptor sono lazy per ogni sottoscrizione: nessuna
promise di una richiesta precedente viene riciclata dal retry.

Nessuna modifica a tenant, SDK policy, Keychain, ruoli, backend, Home V5,
calendario, inviti o login web. Nessun reset della cache per aggirare errori.

## Freshness

Non introduciamo cache persistenti di ruolo o contesto. Anche al warm unlock
resta una verifica /api/me. Un eventuale lease solo in memoria richiederebbe
durata e semantica di revoca concordate: sospensioni e cambi permesso non
possono aspettare arbitrariamente una cache client. Prima misuriamo dove si
trova il costo; nessuna autorizzazione offline viene introdotta.

## Collaudo iPhone necessario

Con 1011: eseguire uno sblocco normale e uno lento/rifiutato. Prima di Riprova
aprire Diagnostica accesso e acquisire la traccia; dopo un retry riuscito la
traccia precedente rimane disponibile. Confrontare local_auth, activation,
token, profile, status e background/foreground dello stesso correlationId.
Non inviare OTP, token, credenziali o log SDK grezzi.

Le misure browser sono simulazioni con SDK/API mock, non misure iPhone.
La causa reale e il miglioramento su dispositivo restano da confermare.

## Verifiche locali

- TypeScript auth/security: 36 test; completamento/root: 17 test.
- Configurazione iOS: 3 test; navigazione Home condivisa: 5 test.
- Browser Android/iOS/web: suite completa superata, inclusi 401/403,
  trasporto, retry, profilo lento, blocco UI e verifica report senza PII.
- Benchmark mock dell'esecuzione: Android 109 ms, iOS 61 ms; 1 prompt,
  1 /api/me, 3 richieste API complessive (profilo + richieste Home).
  Scenario profilo lento simulato: 1270 ms; retry 503 simulato: 296 ms.
- Build Angular e sync entrambe le piattaforme riusciti.
- Test Kotlin/Android e assembleDebug riusciti. Swift e Xcode sono verificati
  nel workflow macOS prima dell'upload; nessun test fisico e' sostituito da CI.
