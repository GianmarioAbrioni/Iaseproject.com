/**
 * IASE Project - Server Render
 * 
 * Versione ottimizzata per Render che evita l'uso di await al livello principale
 * e usa una configurazione semplificata per massima compatibilità.
 */

// Configurazione database
process.env.PGHOST = process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a';
process.env.PGUSER = process.env.PGUSER || 'iaseproject';
process.env.PGDATABASE = process.env.PGDATABASE || 'iaseproject';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1';
process.env.PGPORT = process.env.PGPORT || '5432';

// Imposta DATABASE_URL se non è già impostato
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}`;
}

// Imposta le variabili d'ambiente per la modalità PostgreSQL
process.env.USE_MEMORY_DB = "false"; // Usa PostgreSQL, non in-memory
process.env.NODE_ENV = "production";

// Importazioni ES Modules
import express from 'express';
import session from 'express-session';
import pg from 'pg';
import ConnectPgSimple from 'connect-pg-simple';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

// Ottieni __dirname per ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inizializza app express
const app = express();
const PORT = process.env.PORT || 3000;

// Crea pool PostgreSQL
console.log("📊 Inizializzazione connessione al database PostgreSQL");
const pgConfig = {
  connectionString: process.env.DATABASE_URL
};
const pool = new pg.Pool(pgConfig);

// Configura session store
const PgSession = ConnectPgSimple(session);
const sessionStore = new PgSession({
  pool,
  createTableIfMissing: true
});

// Setup di base
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'iase-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: 'auto', maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

// Endpoint base
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    mode: 'PostgreSQL', 
    date: new Date(),
    db: process.env.PGDATABASE,
    host: process.env.PGHOST
  });
});

// Test connessione database
app.get('/api/db-test', (req, res) => {
  pool.connect()
    .then(client => {
      client.query('SELECT NOW() as time')
        .then(result => {
          client.release();
          res.json({ 
            connected: true, 
            time: result.rows[0].time
          });
        })
        .catch(err => {
          client.release();
          res.status(500).json({ error: err.message });
        });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Avvia server
const server = http.createServer(app);

// Verifica connessione database prima di avviare
pool.connect()
  .then(client => {
    // Rilascia connessione di test
    client.release();
    console.log("✅ Connessione al database PostgreSQL stabilita");
    
    // Avvia server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server avviato su http://0.0.0.0:${PORT}`);
      console.log("🔧 IASE Project - Modalità database: POSTGRESQL");
      console.log(`🔧 Ambiente: ${process.env.NODE_ENV}`);
    });
  })
  .catch(err => {
    console.error("❌ Errore nella connessione al database:", err);
    
    // Avvia comunque il server per altre funzionalità
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server avviato su http://0.0.0.0:${PORT} (Modalità limitata)`);
      console.log("⚠️ Database non disponibile!");
      console.log(`🔧 Ambiente: ${process.env.NODE_ENV}`);
    });
  });