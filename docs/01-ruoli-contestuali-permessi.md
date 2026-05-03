# Ruoli contestuali e permessi utenti

## Modello fondamentale

Una persona NON ha un ruolo globale fisso. Ha ruoli diversi in contesti diversi.

**Chiave:** `Persona → Ruolo → Contesto`

Il contesto può essere: Comunità, Equipe catechisti, Parrocchia, Settore, Sistema.

Esempio valido: Danilo Greco è Responsabile nella 1ª Comunità Fornaci, Membro equipe della 3ª, Capo equipe della 4ª e 5ª.

---

## Ruoli principali

**Ruoli di comunità:** Responsabile, Corresponsabile, Ostiario, Cantore, Prete, Fratello/Sorella

**Ruoli equipe catechisti:** Capo equipe, Catechista membro equipe, Referente approvatore finale

**Ruoli sistema:** Global Admin, (Admin operativo — futuro se necessario)

---

## Permessi per ruolo

### Global Admin (ruolo di piattaforma, non comunitario)

Può:
- gestire utenti, ruoli, diocesi, settori, parrocchie, comunità, equipe catechisti
- associare comunità figlie
- vedere audit/log
- correggere errori di associazione
- gestire configurazioni privacy
- gestire strutture

### Responsabile Comunità

Può:
- vedere e modificare la propria comunità
- modificare la tappa del Cammino
- censire membri/unità
- inviare inviti anagrafica/privacy
- vedere stato privacy/consensi
- creare convivenze della propria comunità
- preparare richieste struttura per convivenze della propria comunità
- autorizzare il corresponsabile ad alcune funzioni

Non può:
- creare convivenze con comunità figlie, salvo se è anche membro attivo di una equipe catechisti con comunità figlie attive
- approvare convivenze dei catechisti, salvo se è referente approvatore finale di quella equipe

### Corresponsabile

Può:
- vedere la comunità
- aiutare nella gestione
- censire membri solo se autorizzato dal responsabile
- inviare inviti privacy solo se autorizzato dal responsabile
- gestire convivenze della comunità solo se autorizzato dal responsabile

Non può (default):
- modificare la tappa del Cammino
- modificare dati strutturali della comunità
- approvare convivenze dei catechisti
- creare convivenze con comunità figlie, salvo se è anche membro equipe catechisti

### Ostiario

Può:
- vedere dati essenziali della comunità
- supportare logistica/presenze se previsto

Non può:
- modificare tappa del Cammino
- gestire privacy completa
- creare convivenze con comunità figlie
- approvare convivenze

### Cantore

Può:
- vedere dati essenziali della comunità
- supportare aspetti liturgici/canti se previsti in futuro

Non può:
- modificare tappa del Cammino
- gestire privacy completa
- creare convivenze con comunità figlie
- approvare convivenze

### Prete

Può:
- vedere comunità associate, se autorizzato
- vedere convivenze/eventi principali
- vedere comunità figlie collegate alla sua comunità di appartenenza, se coinvolto
- vedere dati personali completi delle comunità autorizzate
- confermare la propria presenza agli eventi/convivenze

Non può:
- approvare organizzativamente — può solo confermare la propria presenza

> **UI:** il badge del ruolo Prete deve essere nero/scuro con testo bianco.

### Fratello / Sorella

Può:
- vedere il proprio profilo
- completare anagrafica
- compilare consensi individuali
- vedere eventi/convivenze a cui partecipa
- vedere l'elenco della propria comunità
- vedere contatti essenziali dei fratelli della propria comunità (telefono, email)

Non può:
- modificare dati degli altri
- vedere documenti privacy/dati sensibili/note riservate altrui
- creare convivenze
- inviare richieste strutture
- modificare comunità

### Catechista membro equipe

Può:
- vedere l'equipe di cui fa parte
- vedere le comunità figlie dell'equipe
- vedere l'elenco completo dei fratelli delle comunità figlie
- preparare convivenze con comunità figlie
- preparare bozza richiesta struttura
- mandare la convivenza al referente approvatore finale

Non può:
- approvare definitivamente, salvo se è anche referente approvatore finale
- cambiare capo equipe
- eliminare equipe
- modificare struttura gerarchica senza autorizzazione

### Referente approvatore finale

Persona specifica all'interno dell'unità capo equipe.

Può:
- vedere tutto ciò che riguarda la propria equipe
- approvare convivenze preparate dai membri equipe
- chiedere correzioni
- approvare l'invio della richiesta struttura
- confermare il risultato finale per l'equipe

---

## Regola finale

Ogni permesso deve dipendere sempre da:

```
Persona + Ruolo + Contesto
```

Non basta dire "questa persona è catechista". Bisogna sapere:
- in quale equipe
- per quali comunità figlie
- con quale ruolo
- se è referente approvatore finale

Qualsiasi feature di permessi, guard Angular, policy backend o UI condizionale deve sempre verificare il triplice contesto — mai solo il ruolo globale.
