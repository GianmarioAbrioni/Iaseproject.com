/**
 * IASE Project - Root Index File
 * 
 * File di bootstrap principale per Render che previene
 * l'errore con i percorsi relativi.
 */

// Dipendenze base
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


// Fix per __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione server
const app = express();
const PORT = process.env.PORT || 10000;

 // Configurazione middleware
app.use(express.urlencoded({ extended: true }));

// Configurazione Express
// Configurazione database
const pg_config = {
  host: process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'iaseproject',
  user: process.env.PGUSER || 'iaseproject',
  password: process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1',
};

// Verifica la presenza della cartella public
const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
  console.error(`ERRORE: Percorso 'public' non trovato: ${publicPath}`);
  console.log('Directory corrente:', __dirname);
  console.log('Contenuto della directory:');
  fs.readdirSync(__dirname).forEach(file => {
    console.log('- ' + file);
  });
} else {
  console.log(`✅ Percorso 'public' trovato: ${publicPath}`);
}

// Configurazione middleware per parsing JSON e URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route API /api/health definita qui (prima di routes.js) perché è una route di base
// e non richiede accesso al database
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    paths: {
      root: __dirname,
      public: publicPath
    }
  });
});

// Nota: NON registriamo ancora il middleware per i file statici
// Verrà registrato solo DOPO aver caricato le API

// PRIMA REGISTRIAMO LE API, POI I FILE STATICI
// Questo è fondamentale per il funzionamento corretto degli endpoint API
import('./server/routes.js')
  .then(module => {
    console.log('✅ Modulo routes.js caricato correttamente');

    if (typeof module.registerRoutes === 'function') {
      // 1. PRIMO PASSO: Registra le rotte API (hanno priorità assoluta)
      const server = module.registerRoutes(app);
      console.log('✅ Routes API registrate correttamente');
      
      // 2. SECONDO PASSO: Servi i file statici (solo DOPO aver registrato le API)
      app.use(express.static(publicPath));
      
      // 3. TERZO PASSO: Fallback per SPA (ultimo middleware registrato)
      app.get('*', (req, res) => {
        if (fs.existsSync(path.join(publicPath, 'index.html'))) {
          res.sendFile(path.join(publicPath, 'index.html'));
        } else {
          res.status(404).send('Page not found');
        }
      });
      
      // 4. Avvia il server
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server IASE in esecuzione sulla porta ${PORT}`);
        console.log(`✅ Modalità: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✅ Database: ${process.env.USE_MEMORY_DB === 'true' ? 'In-Memory' : 'PostgreSQL'}`);
      });
    } else {
      throw new Error('La funzione registerRoutes non è stata trovata nel modulo');
    }
  })
  .catch(err => {
    console.error('❌ Errore nel caricamento di server/routes.js:', err);
  });