# Configurazione Database su Render

Questa guida ti aiuta a configurare correttamente l'applicazione IASE Project per utilizzare il database PostgreSQL su Render.

## Variabili d'ambiente necessarie

Imposta queste variabili d'ambiente nel pannello di controllo di Render:

```
DATABASE_URL=postgresql://iaseproject:GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1@dpg-d0ff45buibrs73ekrt6g-a/iaseproject
PGHOST=dpg-d0ff45buibrs73ekrt6g-a
PGPORT=5432
PGDATABASE=iaseproject
PGUSER=iaseproject
PGPASSWORD=GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1
```

## Impostare le variabili d'ambiente

1. Vai alla dashboard di Render
2. Seleziona il tuo servizio web IASE Project
3. Vai a "Environment" nel menu
4. Aggiungi ogni variabile nella sezione "Environment Variables"
5. Fai clic su "Save Changes"

## Note importanti

- L'URL interno è utilizzato in produzione perché il servizio web e il database si trovano nella stessa rete Render
- La configurazione SSL è necessaria per la connessione al database
- L'applicazione verifica automaticamente la connessione all'avvio

## Troubleshooting

Se riscontri problemi di connessione al database:

1. Verifica che le variabili d'ambiente siano impostate correttamente
2. Controlla i log dell'applicazione su Render
3. Se l'errore persiste con l'URL interno, prova con l'URL esterno:
   ```
   DATABASE_URL=postgresql://iaseproject:GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1@dpg-d0ff45buibrs73ekrt6g-a.oregon-postgres.render.com/iaseproject
   PGHOST=dpg-d0ff45buibrs73ekrt6g-a.oregon-postgres.render.com
   ```