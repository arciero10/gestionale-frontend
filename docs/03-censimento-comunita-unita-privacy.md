# Censimento comunità, unità e privacy individuale

## Gestione per unità organizzative

La comunità non deve essere gestita come un semplice elenco di singole persone.
Deve essere gestita per **unità organizzative**.

---

## Tipi unità

I tipi unità sono:

- Coppia
- Fratello singolo
- Sorella singola

Questa logica vale sia per i membri della comunità che per l'equipe dei catechisti.

---

## Coppia

Una coppia è una unità organizzativa composta da due persone.

Esempio:
> Egidio e Daniela

Nel gestionale compariono come unità unica: **Egidio e Daniela**

Ma i dati personali restano individuali:
- Egidio ha i suoi dati
- Daniela ha i suoi dati
- Egidio ha i suoi consensi
- Daniela ha i suoi consensi

---

## Fratello / Sorella singola

Fratello singolo e sorella singola sono unità composte da una sola persona.

Esempio:
> Rosanna Lentini

---

## Privacy individuale

La privacy resta sempre individuale.

Anche se una coppia viene gestita come unità, i consensi devono essere raccolti separatamente per ciascuna persona.

```
Coppia     = unità organizzativa
Persona    = soggetto privacy
```

Non esiste il "consenso di coppia". Ogni persona firma i propri consensi.

---

## Censimento comunità

Il responsabile censisce la comunità inserendo unità.

Per ogni unità inserisce:
- nome e cognome persona 1
- nome e cognome persona 2 (se coppia)
- email
- telefono (se disponibile)
- eventuale ruolo comunitario

Dopo il censimento:
- l'unità compare nella pagina **"La tua Comunità"**
- la pagina **"Censimento comunità"** non duplica un elenco permanente
- l'elenco ufficiale sta in **"La tua Comunità"**

---

## Invito anagrafica

Dopo il censimento il responsabile può inviare un invito.

Il fratello/coppia riceve una mail con link per:
- completare l'anagrafica
- inserire dati mancanti
- accettare la privacy
- compilare i consensi individuali

Se è una coppia:
- l'invito può essere unico
- ma i consensi restano separati per ogni persona

---

## Visibilità dati nella comunità

I fratelli e le sorelle possono vedere l'elenco della propria comunità.
Telefono, email, coniuge e compleanno sono dati comunitari visibili nella stessa comunita, se presenti:

| Visibile | Non visibile |
|---|---|
| Nome e cognome | Documenti privacy altrui |
| Telefono, se presente | Dati sensibili |
| Email, se presente | Note riservate |
| Ruolo comunitario | Audit/log |

La visibilita comunitaria non richiede un User per la persona censita.
ShowPhone, ShowEmail, ShowFamily e ShowBirthday restano nel DB come flag legacy,
ma non filtrano questi dati. Nessuna nuova migration e nessuna cancellazione.
Il compleanno e solo giorno/mese: il nuovo BirthdayLabel non contiene l'anno.
ShowBirthDate continua a proteggere la data completa; ShowPhoto resta separato.

Il backend applica lo scoping alla comunita autenticata. Nessuna storia
matrimoniale, nota libera o dato sensibile e restituito. Marriage attivo
e membership attive dei due coniugi nella stessa comunita determinano il
collegamento visibile; non i toggle legacy.
Solo il titolare modifica ReceiveBirthdayNotifications e
ReceiveCommunityNotifications. Notifica OFF non nasconde contenuti nell'app.

La gestione anagrafica e un contesto distinto: Responsabile e Corresponsabile
con delega EDIT_MEMBRI possono aprire il selettore operativo del coniuge,
limitato ai nominativi/identificativi necessari nella propria comunita.
Questo non modifica preferenze personali. Il backend verifica il permesso prima di restituire
il selettore; un Fratello non riceve questi dati operativi.
Ogni modifica del collegamento e auditata con l'utente reale.

L'amministrazione tecnica/onboarding non attribuisce accesso ai dati personali
di altre comunita. Per API, migration e UX mobile vedere docs/12-mobile-community.md.
Le regole correnti sui dati comunitari e notifiche sono in docs/13-mobile-birthdays.md.

---

## Regola finale

Il gestionale organizza le persone per unità, ma tutela privacy e consensi a livello individuale.

> Ogni operazione su privacy e consensi scende sempre al livello della singola persona, mai all'unità.
