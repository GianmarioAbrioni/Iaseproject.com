/**
 * IASE Project - Server Standalone PostgreSQL
 * 
 * Versione standalone del server per Render che utilizza PostgreSQL.
 * Questo file è una versione ridotta che funziona direttamente su Render.
 */

// Configurazione database
process.env.PGHOST = process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a';
process.env.PGUSER = process.env.PGUSER || 'iaseproject';
process.env.PGDATABASE = process.env.PGDATABASE || 'iaseproject';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1';
process.env.PGPORT = process.env.PGPORT || '5432';

// Imposta DATABASE_URL se non è già impostato
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
}

// Imposta le variabili d'ambiente per la modalità PostgreSQL
process.env.USE_MEMORY_DB = "false"; // Usa PostgreSQL, non in-memory
process.env.NODE_ENV = "production";

// Importazioni standard
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import pkg from 'pg';
const { Pool } = pkg;
import ConnectPgSimple from 'connect-pg-simple';

// Calcola __dirname (non disponibile in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inizializza express
const app = express();
const PORT = process.env.PORT || 3000;

// Configurazione database
console.log("📊 Inizializzazione connessione al database PostgreSQL");
const pgConfig = {
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
  ssl: false  // No SSL per connessioni interne su Render
};

// Crea pool PostgreSQL
const pool = new Pool(pgConfig);

// Verifica connessione
try {
  const client = await pool.connect();
  console.log("✅ Connessione al database PostgreSQL stabilita:", new Date().toISOString());
  client.release();
} catch (err) {
  console.error("❌ Errore nella connessione al database:", err);
  // Continua comunque per altri servizi
}

// Configura session store PostgreSQL
const PgSession = ConnectPgSimple(session);
const sessionStore = new PgSession({
  pool,
  createTableIfMissing: true
});

// Configura le sessioni
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'iase-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: 'auto', maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 giorni
}));

// Middleware per parse JSON
app.use(express.json());

// Folder per file statici
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Middleware per log richieste
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Configurazione di base
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    mode: 'PostgreSQL', 
    date: new Date(),
    env: process.env.NODE_ENV,
    database: {
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER
    }
  });
});

// Avvio server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server avviato su http://0.0.0.0:${PORT}`);
  console.log("🔧 IASE Project - Modalità database: POSTGRESQL");
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV}`);
});