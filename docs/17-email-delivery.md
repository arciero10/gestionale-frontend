# Email inviti: stato preparatorio

La verifica della sottoscrizione Azure attiva non ha trovato risorse Communication
Services visibili; la Container App non ha variabili Email__ configurate.
Per il punto di arresto richiesto non sono stati creati provider o domini cloud.

Il backend ora espone un contratto preparatorio SendInvitationAsync con risultato
NOT_SENT / SENT / FAILED e un template HTML/testo sicuro. Il sender attivo resta
PREPARED_NOT_SENT: nessuna email reale inviata e nessuna promessa di consegna.
Il template non e ancora collegato al flusso create. La UI attuale resta corretta:
"Invito creato - Email preparata, non inviata", Copia link, Apri email, Annulla.
Autenticazione, lifecycle inviti e dati locali non sono stati modificati.

Prima dell'attivazione occorre configurare ACS Email, dominio verificato e
credenziali server-side; dettagli e passaggi in backend docs/EmailDelivery.md.
Configurazioni previste: Email__Provider, Email__SenderAddress,
Email__SenderDisplayName, Email__ConnectionString (secret se utilizzata),
Email__DeliveryMode=Test con allowlist esplicita oppure mailbox di test.
Nessuna di queste configurazioni attiva ancora un adapter.

Delivery persistente, reinvio dello stesso invito e UI sent/failed/retry sono
rinviati alla conferma del provider. Richiederanno migration creata ma non
applicata automaticamente e push backend sospeso fino all'allineamento TEST.
Questa fase preparatoria non richiede migration.
