# Equipe catechisti, capo equipe e approvazione finale

## Struttura dell'equipe

Una equipe dei catechisti non è una lista piatta di singole persone.
È composta da **unità**:

- Coppia
- Fratello singolo
- Sorella singola

Ogni unità contiene una o due persone.
I dati personali e i consensi restano sempre individuali per ciascuna persona.

---

## Capo equipe

Il capo equipe deve essere modellato come **unità**, non solo come singola persona.

Esempio:
> Capo equipe unità: Paolo e Angela Bencetti

Se il capo equipe è una coppia, la coppia rappresenta l'unità capo equipe.

Però deve esistere anche un **referente approvatore finale**, cioè una persona specifica dell'unità capo equipe.

Esempio:
> Capo equipe unità: Paolo e Angela Bencetti
> Referente approvazione finale: Paolo Bencetti

---

## Operatività dell'equipe

Tutti i membri attivi dell'equipe possono preparare una convivenza per conto dell'equipe.

Non serve che il capo equipe abiliti preventivamente ogni membro alla creazione della convivenza.

**NON usare questa logica:**
- capo equipe abilita/disabilita membro per creare convivenze

**Usare invece questa logica:**
1. Membro equipe prepara la convivenza
2. Capo equipe/referente approvatore viene informato
3. Referente approvatore approva il risultato finale

---

## Convivenze con comunità figlie

Le convivenze con comunità figlie sono organizzate dall'equipe dei catechisti.

La persona che materialmente crea o prepara la convivenza può essere:
- il referente approvatore
- il coniuge del referente
- un altro membro attivo dell'equipe

Ma la **convivenza deve risultare organizzata dall'equipe**, non dal singolo.

Esempio:
```
Convivenza: 2° Scrutinio

Creata da: Angela Bencetti
Organizzata dai catechisti
Equipe organizzatrice: Equipe di Paolo e Angela Bencetti
Comunità destinataria: 3ª Comunità – S. Maria delle Grazie alle Fornaci
In attesa approvazione: Paolo Bencetti
```

Dopo approvazione:
```
Approvata da: Paolo Bencetti
```

---

## Modello dati consigliato

### EquipeCatechisti
| Campo | Tipo |
|---|---|
| id | uuid |
| nomeEquipe | string |
| capoEquipeUnitaId | uuid → UnitaEquipeCatechisti |
| referenteApprovazionePersonaId | uuid → Persona |
| note | string? |

### UnitaEquipeCatechisti
| Campo | Tipo |
|---|---|
| id | uuid |
| equipeId | uuid → EquipeCatechisti |
| tipoUnita | `Coppia` \| `Fratello singolo` \| `Sorella singola` |
| nomeVisualizzato | string |
| ruoloUnita | `Capo equipe` \| `Catechisti` |
| statoUnita | `Attiva` \| `Sospesa` \| `Storica` |

### UnitaEquipePersona
| Campo | Tipo |
|---|---|
| unitaEquipeId | uuid → UnitaEquipeCatechisti |
| personaId | uuid → Persona |
| ordine | int |

### Convivenza
| Campo | Tipo |
|---|---|
| id | uuid |
| tipoConvivenza | string |
| organizzataDa | `Equipe dei catechisti` \| `Comunità` |
| equipeOrganizzatriceId | uuid? → EquipeCatechisti |
| comunitaDestinatariaId | uuid → Comunita |
| creataDaPersonaId | uuid → Persona |
| statoApprovazione | enum (vedi sotto) |
| approvatoreFinalePersonaId | uuid → Persona |
| dataApprovazione | datetime? |
| noteApprovazione | string? |

---

## Stati approvazione

Per convivenze con comunità figlie:

```
Bozza
In preparazione
In attesa approvazione
Approvata
Da correggere
Annullata
```

Solo dopo stato **Approvata** la convivenza può proseguire verso:
- scelta definitiva struttura
- invio richiesta struttura
- conferma convivenza

---

## UI — cosa mostrare e cosa non mostrare

**Non mostrare:**
- Tipo catechistico
- Categoria catechistica
- master/slave
- organizzatore operativo

**Mostrare invece:**
- Organizzata dai catechisti
- Equipe organizzatrice
- Comunità destinataria
- In attesa approvazione: `<nome>`
- Approvata da: `<nome>`

### Esempio card

```
2° Scrutinio

Organizzata dai catechisti
Equipe organizzatrice: Equipe di Paolo e Angela Bencetti
Comunità destinataria: 3ª Comunità – S. Maria delle Grazie alle Fornaci
In attesa approvazione: Paolo Bencetti
```
