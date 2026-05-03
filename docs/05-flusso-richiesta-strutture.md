# Flusso richiesta strutture e approvazione

## Origine della richiesta

Le richieste alle strutture devono partire da una convivenza o da un posto di convivenza selezionato.

La richiesta struttura può nascere da:

1. Convivenza della comunità
2. Convivenza con comunità figlie
3. Pagina Posti di Convivenza

---

## Convivenza della comunità

Se la convivenza è della comunità:

**Richiedente:** Comunità

Esempio:
> 3ª Comunità – S. Maria delle Grazie alle Fornaci

Il responsabile o ruolo autorizzato può:
- scegliere struttura
- preparare bozza richiesta
- inviare richiesta quando il backend sarà attivo
- seguire risposta struttura

---

## Convivenza con comunità figlie

Se la convivenza è con comunità figlie:

**Richiedente:** Equipe dei catechisti
**Comunità destinataria:** Comunità figlia

Esempio:
```
2° Scrutinio

Organizzata dai catechisti
Equipe organizzatrice: Equipe di Paolo e Angela Bencetti
Comunità destinataria: 3ª Comunità – S. Maria delle Grazie alle Fornaci
```

Un membro equipe può preparare:
- dati convivenza
- struttura
- bozza richiesta email

Il referente approvatore finale deve approvare prima del risultato finale o dell'invio ufficiale.

---

## Posti di Convivenza

Flusso dalla pagina Posti di Convivenza:

```
Posti di Convivenza
→ seleziona struttura
→ clic "Invia richiesta"
→ apre nuova richiesta precompilata
→ seleziona convivenza o crea nuova convivenza
→ genera oggetto e corpo email
→ salva bozza richiesta
```

---

## Oggetto email

L'oggetto deve contenere sempre il codice richiesta.

**Formato:**
```
[EC-2026-000001] Richiesta disponibilità convivenza
```

- Il codice richiesta **non è modificabile** dall'utente
- Il testo dopo il codice **è modificabile**

---

## Corpo email default

Template default (precompilato ma modificabile):

```
Gentili,

con la presente chiediamo disponibilità per una convivenza.

Date:
dal {dataInizio} al {dataFine}

Comunità coinvolte:
{listaComunita}

Numero indicativo partecipanti:
{numeroPartecipanti}

Note:
{note}

Restiamo in attesa di un vostro riscontro.

Cordiali saluti
Eventi di Comunità
```

---

## Date

Tutte le date devono essere in formato italiano:

```
dd-MM-yyyy
```

Esempio: `20-04-2026`

---

## Stati richiesta struttura

**Stati principali:**

| Stato | Significato |
|---|---|
| Bozza | Email preparata, non inviata |
| Inviata | Richiesta inviata alla struttura |
| Risposta ricevuta | La struttura ha risposto |
| Confermata | Struttura confermata |
| Annullata | Richiesta chiusa o annullata |

**Esito risposta struttura** (campo separato):

| Esito | |
|---|---|
| Da valutare | Risposta ricevuta, esito ancora da valutare |
| Disponibile | Struttura disponibile |
| Non disponibile | Struttura non disponibile |
| Preventivo ricevuto | È stato ricevuto un preventivo |

Esempio:
> Stato richiesta: Risposta ricevuta
> Esito risposta: Preventivo ricevuto

---

## Risposte email (backend futuro)

Quando sarà attivo il backend, il sistema leggerà la mailbox dedicata.

**Mailbox prevista:** `richieste@eventidicomunita.it`

Ogni risposta deve essere collegata tramite codice richiesta nel formato `[EC-2026-000001]`.

La risposta deve:
- essere salvata nei messaggi della richiesta
- aggiornare lo stato a "Risposta ricevuta"
- evitare duplicati tramite `MessageIdGraph`

---

## Regola finale

La richiesta struttura non è una funzione isolata.
Nasce da una convivenza e deve sapere chi è il richiedente:

- **Comunità**
oppure
- **Equipe dei catechisti**

Nel caso dei catechisti, deve sapere anche la **comunità destinataria**.
