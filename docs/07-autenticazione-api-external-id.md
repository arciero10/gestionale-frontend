# Identita Microsoft e contesto API

## Configurazione prima dell'attivazione

La login SPA esistente resta separata dall'autorizzazione dell'API. Gli scope
`openid`, `profile`, `email` non sono lo scope della nostra API.

Registrare la risorsa API nel tenant External ID e uno scope delegato reale.
Autorizzare la SPA esistente a richiederlo e configurare il consenso nel tenant.
Nessun client secret va nella SPA. Nessuno scope viene inventato nel codice.

Nel frontend, `public/api-config.json` viene letto prima del bootstrap Angular:

- `API_BASE_URL`: URL che include `/api`, attualmente quello della Container App.
- `API_SCOPE`: `api://71a9f6da-a231-4285-b475-37d2e65b8fe1/access_as_user`.

Lo scope reale e configurato nel JSON runtime e negli environment di fallback.
La protectedResourceMap copre tutte le chiamate all'origine API Azure;
login base e Client ID SPA restano invariati.

Il JSON pubblicato e configurazione pubblica, non contiene segreti. Le variabili
del sistema operativo non vengono lette automaticamente dal browser: la procedura
di deploy deve valorizzare il JSON oppure i corrispondenti campi degli environment
Angular prima della build. I workflow non sono stati modificati.

Con scope vuoto, il login e i moduli attuali continuano a funzionare e `/api/me`
non viene chiamato. Il contesto locale preesistente resta compatibilita temporanea;
non e un'identita affidabile ne un CommunityId DB.

Nel backend configurare tramite environment Azure o user-secrets:

- `ExternalId__TenantId`: `069bb457-b363-4340-8086-d7dd3b60a2b5`.
- `ExternalId__Authority`: `https://eventidicomunita.ciamlogin.com/069bb457-b363-4340-8086-d7dd3b60a2b5`.
- `ExternalId__Audience` oppure `ExternalId__ClientId`: identificatore della
  registrazione API, non il Client ID della SPA.
- `ExternalId__RequiredScope`: nome del permesso delegato contenuto in `scp`.
  Se omesso e comunque obbligatoria la presenza di uno scope delegato; in deploy
  configurarlo per limitare l'accesso al permesso previsto.

Il backend include in appsettings.json i valori pubblici reali: tenant e authority
indicati sopra, Audience/ClientId `71a9f6da-a231-4285-b475-37d2e65b8fe1`
e RequiredScope `access_as_user`. Accetta come audience il Client ID API
oppure `api://71a9f6da-a231-4285-b475-37d2e65b8fe1`, mai il Client ID SPA.
Environment e user-secrets possono sovrascrivere questi valori. Nessun segreto
o connection string e incluso in questo file.

L'authority usa discovery v2.0 HTTPS e relative chiavi pubbliche Microsoft.
Issuer, audience, firma, scadenza e tenant vengono verificati. `oid` e `tid`
devono essere GUID validi; email e nome sono soltanto dati descrittivi.
Non vengono accettati ID token o token app-only privi di scope delegati.

## Collegamento nel database

Riutilizzare `User`, `Person`, `CommunityMember`. Applicare, dopo revisione:

```powershell
dotnet ef database update --project .\Gestionale.csproj --startup-project .\Gestionale.csproj
```

La migration `AddMicrosoftIdentityToUsers` crea la tabella per l'entita `User`
gia esistente ma precedentemente non mappata. Aggiunge i riferimenti Microsoft
e PersonId, indice univoco `(MicrosoftTenantId, MicrosoftObjectId)`, e i campi
`Role` e `Active` sulle appartenenze. Non migra o deduce ruoli da valori client.
Le appartenenze esistenti partono attive come `MEMBER`.

Un amministratore deve associare esplicitamente l'identita verificata a
`User.PersonId`. La persona deve avere una `CommunityMember` attiva con ruolo
assegnato dal server. Nessun auto-collegamento per email o `Person.UserId` legacy.
Nessuna registrazione account o password custom viene introdotta.

Se ci sono piu appartenenze, `User.CommunityId` puo selezionare soltanto una
delle appartenenze attive effettivamente presenti nel DB. Senza una selezione
univoca si restituisce `ASSOCIATION_REQUIRED`, senza scegliere la prima riga.
`communityMemberId` e la rappresentazione `CommunityId:PersonId` della chiave
composta esistente; non viene introdotta una seconda entity Member.

## /api/me e compatibilita

`GET /api/me` usa esclusivamente lo schema `ExternalIdApi`. Token valido e
mapping assente restituiscono HTTP 200, `linkedToCommunity: false`, stato
`UNLINKED`. Utenti disattivati restituiscono `INACTIVE` senza CommunityId.
Token assente/non valido restituisce 401; scope insufficiente restituisce 403.
Configurazione JWT assente non avvia discovery e non consente accesso.

Il resolver restituisce CommunityId, numero, nome e ruolo dal database.
Il numero e un dato di presentazione e non viene mai usato come chiave DB.
Permessi responsabile sono limitati alla propria appartenenza; corresponsabile,
catechista e ostiario partono con consultazione, senza dedurre deleghe o equipe.
Le future API comunitarie devono usare la stessa policy e il resolver per ogni
richiesta: mai un parametro communityId del client come fonte autorevole.

Il backend preferisce Bearer quando presente. Senza Bearer, ProxyTrust resta
per i controller legacy; `/api/me` non usa mai quel fallback. Le rotte legacy
non sono rese sicure da questa modifica e non vanno riutilizzate per le nuove
API di dati personali senza migrare la loro autorizzazione.

Il frontend conserva `/api/me` soltanto in memoria, per l'account MSAL corrente.
Con API attiva usa quei ruoli e permessi nelle policy e il CommunityId DB
separatamente dal numero visualizzato. Mapping assente mostra il messaggio
di associazione; un errore API non recupera CommunityId o privilegi dal storage.
L'onboarding preesistente non costituisce un'assegnazione di ruolo sul server.

## Verifica

```powershell
dotnet run --project .\Tests\Identity\IdentityChecks.csproj
```

I test backend usano TestServer, chiavi locali e DB in memoria: due utenti con
la stessa email e comunita 10/20 mantengono i rispettivi contesti anche con
querystring ostili e header di ruoli. Verificano anche firma, issuer, audience,
tenant, scope, scadenza, utenti non associati/disattivati e rifiuto ProxyTrust.
Non verificano una login Azure reale finche scope e registrazione API non sono
configurati. La migration e preparata, non applicata automaticamente.

## File interessati

Frontend, root `C:/Users/aless/Desktop/Gestionale`:

- `src/main.ts`, `src/app.config.ts`, `src/app.ts`
- `src/environments/environment.ts`, `src/environments/environment.development.ts`
- `public/api-config.json`
- `src/app/auth/api-config.ts`, `src/app/auth/current-user-context.ts`, `src/app/auth/current-user.service.ts`
- `src/app/layout/components/app.layout.ts`
- `src/app/features/gestionaleCN/data/access-context.mock.ts`
- `src/app/features/gestionaleCN/data/access-policy.mock.ts`
- `src/app/features/gestionaleCN/data/community-selection.storage.ts`
- `src/app/features/dashboards/dashboard.ts`
- `src/app/services/area.service.ts`, `src/app/services/event.service.ts`
- `src/app/services/parish.service.ts`, `src/app/services/person.service.ts`
- `src/app/features/strutture/strutture-api.service.ts`
- Questo documento.

Backend, root `C:/Users/aless/Desktop/GestionaleApiClean`:

- `Auth/ExternalIdApiAuthentication.cs`, `Controllers/MeController.cs`
- `Services/CurrentUserService.cs`
- `Models/User.cs`, `Models/CommunityMember.cs`, `Data/CnDbContext.cs`
- `DependecyInjection.cs`, `Program.cs`, `Gestionale.csproj`
- `Migrations/20261011191422_AddMicrosoftIdentityToUsers.cs` e relativo Designer
- `Migrations/CnDbContextModelSnapshot.cs`
- `Tests/Identity/IdentityChecks.csproj`, `Tests/Identity/Program.cs`
- `docs/ExternalIdApi.md`

Riferimento Microsoft:
[Validazione claims](https://learn.microsoft.com/en-us/entra/identity-platform/claims-validation).
