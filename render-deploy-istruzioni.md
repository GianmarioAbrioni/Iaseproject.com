# Istruzioni Deploy su Render

Questo documento contiene le istruzioni dettagliate per il deploy del progetto IASE su Render.

## Opzione 1: Deploy con render.yaml (consigliato)

1. Carica tutti i file su Render (incluso il file `render.yaml`)
2. Render leggerà automaticamente la configurazione dal file YAML
3. Il deploy userà `server-fix.js` come punto di ingresso

## Opzione 2: Deploy manuale 

Se il deploy con `render.yaml` non funziona, puoi configurare manualmente:

1. Crea un nuovo Web Service su Render
2. Seleziona "Build and deploy from a Git repository"
3. Collega il repository GitHub
4. Configura il servizio:
   - **Name**: iase-project-web
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server-fix.js`
   - **Aggiungi le variabili d'ambiente** dal file `.env.render`

## Opzione 3: Deploy con Dockerfile

Se preferisci un approccio containerizzato:

1. Crea un nuovo Web Service su Render
2. Seleziona "Build and deploy from a Git repository"
3. Nella sezione di configurazione, seleziona "Docker" invece di "Node"
4. Render utilizzerà automaticamente il Dockerfile presente nel repository

## Troubleshooting

Se riscontri errori durante il deploy:

1. **Errore paths[0]**: Questo è un problema con i percorsi del filesystem. Assicurati di usare `server-fix.js` come punto di ingresso.

2. **Errore cartella public non trovata**: 
   - Aggiungi la variabile `PUBLIC_PATH` con il valore `/opt/render/project/src/public`
   - Oppure usa la variabile `ALTERNATIVE_PUBLIC_PATH`

3. **Problemi con il database**:
   - Controlla i log per verificare che le variabili d'ambiente del database siano caricate correttamente
   - Verifica che il database sia accessibile da Render

## Struttura dei file chiave

- **server-fix.js**: File principale che evita problemi di percorso
- **.env.render**: File con tutte le variabili d'ambiente
- **render.yaml**: Configurazione per Render
- **Dockerfile**: Configurazione per approccio containerizzato

## Note aggiuntive

- Il file `server-fix.js` include diagnostica dettagliata che apparirà nei log
- I percorsi `/app/public` e `/opt/render/project/src/public` sono entrambi testati automaticamente
- Per debugging, usa le variabili `DEBUG=true` e `LOG_LEVEL=verbose`