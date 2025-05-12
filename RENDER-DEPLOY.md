# IASE Project - Istruzioni di Deploy su Render

Questo documento contiene le istruzioni per il deploy del progetto IASE su Render.

## Prerequisiti

- Un account Render (gratuito o a pagamento)
- Repository GitHub contenente il codice aggiornato del progetto

## Deploy dell'applicazione

### 1. Preparazione del repository

Assicurati che le seguenti modifiche siano state applicate al repository GitHub:

- File `render.yaml` aggiornato con le configurazioni corrette
- File TypeScript aggiornati con le correzioni per la verifica NFT 
- File non necessari spostati nella cartella `backup/`

### 2. Deploy su Render

1. Accedi a Render Dashboard: https://dashboard.render.com/
2. Vai alla sezione "Blueprints"
3. Clicca su "New Blueprint Instance"
4. Seleziona il repository GitHub contenente il progetto
5. Render rileverà automaticamente il file `render.yaml` e configurerà:
   - Un servizio web (`iase-project-web`)
   - Un job cron giornaliero per la verifica NFT (`nft-verification-job`)

6. Clicca su "Create Blueprint Instance" per avviare il deploy

### 3. Monitoraggio del deploy

Una volta avviato il deploy, puoi monitorare lo stato:

1. Vai alla sezione "Services" nella dashboard di Render
2. Seleziona il servizio `iase-project-web`
3. Controlla i log di build e deploy per eventuali errori

### 4. Verifica del deploy

Dopo che il deploy è completato, verifica che l'applicazione funzioni correttamente:

1. Apri l'URL dell'applicazione (fornito da Render)
2. Verifica che il sito si carichi correttamente
3. Controlla l'endpoint di health check: `{URL}/health`
   - Dovresti vedere una risposta JSON con `"status": "ok"` e `"database": "connected"`

### 5. Configurazione del cron job

Il job di verifica NFT è configurato per eseguirsi automaticamente ogni giorno a mezzanotte. Puoi verificare la sua configurazione:

1. Vai alla sezione "Cron Jobs" nella dashboard di Render
2. Seleziona il job `nft-verification-job`
3. Controlla che sia configurato con la schedule `0 0 * * *` (mezzanotte ogni giorno)

## Troubleshooting

Se incontri problemi durante il deploy:

1. **Errori di build**:
   - Verifica i log di build su Render
   - Assicurati che tutte le dipendenze siano installate correttamente

2. **Errori di connessione al database**:
   - Controlla le credenziali del database in `render.yaml`
   - Verifica che il database PostgreSQL sia attivo e accessibile

3. **Errori nella verifica NFT**:
   - Controlla i log del cron job dopo la sua esecuzione
   - Verifica che le API Ethereum siano raggiungibili e funzionanti

## Note importanti

- **Dati reali**: L'applicazione è configurata per utilizzare dati reali, non di test
- **Database**: Viene utilizzato PostgreSQL per garantire la persistenza dei dati
- **Ambiente di produzione**: Tutte le configurazioni sono impostate per un ambiente di produzione
- **Memoria**: È stata ottimizzata la configurazione di memoria per Node.js