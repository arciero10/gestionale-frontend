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
I contatti essenziali sono condivisi solo con il consenso individuale del titolare:

| Visibile | Non visibile |
|---|---|
| Nome e cognome | Documenti privacy altrui |
| Telefono, se autorizzato | Dati sensibili |
| Email, se autorizzata | Note riservate |
| Ruolo comunitario | Audit/log |

Foto e data di nascita/compleanno richiedono anch'essi consenso esplicito.
Tutti i flag di condivisione e le preferenze notifiche nascono disattivati,
anche per le persone censite dal Responsabile. Il consenso onboarding al trattamento
non equivale al consenso alla condivisione nella rubrica.

Il filtro viene applicato dal backend: i campi non condivisi non sono serializzati.
Il titolare vede i propri dati e gestisce solo i propri consensi. Il Responsabile
non puo abilitare consensi altrui o sovrascrivere contatti nascosti.
Il collegamento al coniuge e visibile solo con consenso di entrambi, matrimonio
attivo e membership attiva di entrambi nella stessa comunita. Nessuna storia
matrimoniale o nota libera viene restituita.

L'amministrazione tecnica/onboarding non attribuisce accesso ai dati personali
di altre comunita. Per API, migration e UX mobile vedere docs/12-mobile-community.md.

---

## Regola finale

Il gestionale organizza le persone per unità, ma tutela privacy e consensi a livello individuale.

> Ogni operazione su privacy e consensi scende sempre al livello della singola persona, mai all'unità.
