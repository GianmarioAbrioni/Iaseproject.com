# IASE Project - Configurazioni Database

Questo progetto supporta due modalità di storage:

1. **Storage in memoria** (con persistenza su file)
2. **Database PostgreSQL**

## Scelta della modalità di storage

### 1. Storage in memoria (default originale)

Utilizza questa modalità se non hai bisogno di un database PostgreSQL o se stai testando localmente. I dati vengono salvati in un file JSON e caricati all'avvio.

```bash
# Avvio con storage in memoria
node server.js  # oppure
node server-standalone.js
```

File di configurazione Render:
```yaml
# render.yaml
```

### 2. Database PostgreSQL

Utilizza questa modalità se vuoi utilizzare un database PostgreSQL esterno come su Render. Questa è la modalità più robusta e scalabile.

```bash
# Avvio con database PostgreSQL
node server-pg.js
```

File di configurazione Render:
```yaml
# render-pg.yaml
```

## Variabili d'ambiente per PostgreSQL

Imposta queste variabili d'ambiente per la connessione a PostgreSQL:

```
DATABASE_URL=postgresql://iaseproject:GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1@dpg-d0ff45buibrs73ekrt6g-a/iaseproject
PGHOST=dpg-d0ff45buibrs73ekrt6g-a
PGPORT=5432
PGDATABASE=iaseproject
PGUSER=iaseproject
PGPASSWORD=GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1
USE_MEMORY_DB=false
```

## Come funziona la selezione della modalità

La modalità di storage è determinata dalla variabile d'ambiente `USE_MEMORY_DB`:

- `USE_MEMORY_DB=true`: Utilizza lo storage in memoria
- `USE_MEMORY_DB=false`: Utilizza PostgreSQL

## Deployment su Render

### Con PostgreSQL (raccomandato)

1. Rinomina `render-pg.yaml` in `render.yaml`
2. Commit e push dei cambiamenti
3. Render utilizzerà PostgreSQL

### Con storage in memoria

1. Usa il file `render.yaml` esistente
2. Commit e push dei cambiamenti
3. Render utilizzerà lo storage in memoria

## Come testare localmente

### Storage in memoria
```bash
node server-standalone.js
```

### PostgreSQL
```bash
# Utilizza l'URL esterno per test locali
export DATABASE_URL="postgresql://iaseproject:GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1@dpg-d0ff45buibrs73ekrt6g-a.oregon-postgres.render.com/iaseproject"
export USE_MEMORY_DB="false"
node server-pg.js
```

## Test di connessione al database
```bash
node test-db-connection.js
```