# Istruzioni per il Deploy su Render

Questo documento contiene le istruzioni per deployare l'applicazione IASE Project su Render senza necessità di configurare un database PostgreSQL.

## Panoramica

Il progetto è configurato per funzionare in due modalità:

1. **Modalità PostgreSQL** - Per sviluppo locale con database
2. **Modalità In-Memory** - Per deployment su Render senza database

## Passi per il Deploy

### 1. Connetti GitHub Repository

- Accedi a [Render Dashboard](https://dashboard.render.com/)
- Clicca su "New" e seleziona "Blueprint"
- Autorizza Render ad accedere al repository GitHub 
- Seleziona il repository IASE Project

### 2. Configurazione Automatica

Il file `render.yaml` contiene tutta la configurazione necessaria:

- Servizio Web per l'applicazione principale
- Servizio Cron per la verifica giornaliera degli NFT
- Variabili d'ambiente pre-configurate

### 3. Configurazione Variabili d'Ambiente

Le seguenti variabili sono già configurate in `render.yaml`:

- `NODE_ENV=production` - Ambiente di produzione 
- `USE_MEMORY_DB=true` - Utilizza storage in memoria
- `SESSION_SECRET` - Generato automaticamente
- `ETH_NETWORK_URL` - URL per connessione Ethereum
- `NFT_CONTRACT_ADDRESS` - Indirizzo contratto NFT IASE
- `REWARD_DISTRIBUTOR_CONTRACT` - Indirizzo contratto distributor
- `BSC_RPC_URL` - URL per connessione BSC

### 4. Deploy

- Clicca "Apply Blueprint"
- Render eseguirà automaticamente:
  - Install delle dipendenze (`npm install`)
  - Build del frontend (`npm run build`)
  - Build dei file server in JavaScript (`esbuild ...`)
  - Avvio dell'applicazione (`node server.js`)

### 5. Verifica

- Dopo il deploy, controlla i logs per assicurarti che l'applicazione sia avviata
- Dovresti vedere messaggi come:
  - `🚀 Avvio IASE Project`
  - `⚙️ Modalità: IN-MEMORY storage (nessun database PostgreSQL richiesto)`
  - `🌐 Ambiente: PRODUCTION`
  - `✅ Applicazione avviata con successo`

## Vantaggi della Modalità In-Memory

- **Semplicità**: Nessuna configurazione database necessaria
- **Costi ridotti**: Nessun servizio database da aggiungere
- **Performance**: Accesso dati veloce in memoria
- **Zero configurazione**: Funziona subito dopo il deploy

## Sviluppo Locale con PostgreSQL

Per sviluppo locale, è comunque possibile utilizzare PostgreSQL:

```bash
# Avvia in modalità PostgreSQL (default)
npm run dev
```

Per testare localmente la configurazione di Render:

```bash
# Avvia in modalità memory come su Render
node server.js
```