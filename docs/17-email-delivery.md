# Email inviti: ACS e modalita TEST

Il backend implementa Azure.Communication.Email, template HTML/testo e allowlist.
La UI distingue creazione invito e invio email: NOT_SENT, SENT, FAILED,
BLOCKED_BY_TEST_MODE. SENT indica operazione ACS completata, non ricevuta in inbox.
Email fallita o bloccata non annulla il link. Nessun invio reale e stato effettuato.

## UI e compatibilita

La card mostra destinatario/scadenza e, dopo creazione, reinvio dello stesso ID,
copia link, apertura client email e annullamento. Riaprendo un invito pendente
recupera lo stato da API. Una lista PENDING mostra Invito attivo, non presume che
l'email sia stata consegnata. I vecchi backend senza emailStatus continuano a
mostrare Email preparata, non inviata e non propongono il nuovo endpoint reinvio.

API: POST /api/onboarding/invitations, GET invitations, GET
/api/onboarding/invitations/{id}/delivery, POST invitations/{id}/resend e /cancel.
Il timeout HTTP create/resend e 70 secondi per il send ACS (40 secondi massimi).
Il server impone cooldown di un minuto e autorizzazione reale della comunita.
Inviti scaduti/annullati/accettati o account gia collegati non sono reinviabili.
Un timeout di rete puo avere esito incerto: verificare lo stato prima di riprovare.

## Attivazione manuale, prima del deploy backend

Migration 20261122113638_CommunityInvitationEmailDelivery CREATA, NON applicata;
push backend SOSPESO fino a migrazione TEST. Nessun aggiornamento DB automatico.
Il frontend e retrocompatibile e puo essere pubblicato separatamente.

Configurare in ca-gestionale-api:
- Email__Provider=AzureCommunicationServices
- Email__SenderAddress=DoNotReply@eventidicomunita.it
- Email__SenderDisplayName=Eventi di Comunita (accenti nel portale)
- Email__DeliveryMode=Test
- Email__AllowedRecipients__0: UNA mailbox di test autorizzata dall'operatore
- Email__ConnectionString: riferimento a secret Azure, mai valore nel repository

Recuperare il segreto da acs-eventidicomunita > Keys / Connection strings e
salvarlo in Container App > Secrets. Non inviarlo in chat.
Il display name effettivo viene da ECS > dominio > MailFrom addresses:
DoNotReply e ancora configurato con displayName DoNotReply. Impostare manualmente
Eventi di Comunità: il solo env SenderDisplayName non puo sovrascriverlo nell'SDK.

Dopo migration, configurazione e deploy, usare solo un membro dedicato ai test
con l'unica mailbox consentita nel normale flusso autenticato. Non Emmanuel o
altri fratelli. Verificare ricezione, From, subject, link e header SPF/DKIM pass.
Nessuna mailbox di test e stata assunta o hardcodata.
Dettagli backend: docs/EmailDelivery.md.
