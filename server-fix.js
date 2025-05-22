/**
 * IASE Project - Server con fix per ESM e path
 * 
 * Questo file è progettato specificamente per funzionare in ambiente Render
 * e risolvere il problema con import.meta.url e paths[0]
 */

// Importazioni standard
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { config as dotenvConfig } from 'dotenv';

// Applica configurazione per variabili d'ambiente
dotenvConfig();

// Stampa informazioni di ambiente per debug
console.log(`[ENV] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[ENV] PUBLIC_PATH: ${process.env.PUBLIC_PATH || 'non impostato'}`);
console.log(`[ENV] STATIC_PATH: ${process.env.STATIC_PATH || 'non impostato'}`);
console.log(`[ENV] CONFIG_PATH: ${process.env.CONFIG_PATH || 'non impostato'}`);
console.log(`[ENV] USE_MEMORY_DB: ${process.env.USE_MEMORY_DB || 'non impostato'}`);
console.log(`[ENV] PORT: ${process.env.PORT || '3000 (default)'}`);
console.log(`[ENV] DATABASE_URL: ${process.env.DATABASE_URL || 'non impostato'}`);
console.log(`[ENV] LOG_LEVEL: ${process.env.LOG_LEVEL || 'non impostato'}`);
console.log(`[ENV] DEBUG: ${process.env.DEBUG || 'non impostato'}`);

// Funzione per logging in base al livello
const logLevels = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4 };
const logLevel = process.env.LOG_LEVEL ? logLevels[process.env.LOG_LEVEL.toLowerCase()] || 2 : 2;

function log(level, message) {
  const messageLevel = logLevels[level.toLowerCase()];
  if (messageLevel <= logLevel) {
    const prefix = level.toUpperCase().padEnd(7);
    console.log(`[${prefix}] ${message}`);
  }
}

// Fix per __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
log('info', `Directory corrente: ${__dirname}`);

// Configurazione database
process.env.PGHOST = process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a';
process.env.PGUSER = process.env.PGUSER || 'iaseproject';
process.env.PGDATABASE = process.env.PGDATABASE || 'iaseproject';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1';
process.env.PGPORT = process.env.PGPORT || '5432';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://iaseproject:GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1@dpg-d0ff45buibrs73ekrt6g-a.oregon-postgres.render.com/iaseproject';
process.env.USE_MEMORY_DB = process.env.USE_MEMORY_DB || "false";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Express setup
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Verifica percorsi e serve file statici
const publicPaths = [
  process.env.PUBLIC_PATH || process.env.STATIC_PATH, // Priorità alle variabili d'ambiente
  process.env.ALTERNATIVE_PUBLIC_PATH, // Percorso alternativo
  path.join(__dirname, 'public'),
  path.join(__dirname, '..', 'public'),
  path.join(process.cwd(), 'public'),
  '/app/public',  // Percorso in ambiente Render
  '/opt/render/project/src/public' // Percorso alternativo in Render
];

let foundPublicPath = null;

// Lista tutte le directory per debug
log('debug', 'Contenuto directory principale:');
fs.readdirSync(process.cwd()).forEach(file => {
  const stats = fs.statSync(path.join(process.cwd(), file));
  log('debug', `- ${file} ${stats.isDirectory() ? '[directory]' : '[file]'}`);
});

log('debug', 'Contenuto directory del server:');
fs.readdirSync(__dirname).forEach(file => {
  const stats = fs.statSync(path.join(__dirname, file));
  log('debug', `- ${file} ${stats.isDirectory() ? '[directory]' : '[file]'}`);
});

// Cerca cartella public
for (const publicPath of publicPaths) {
  if (!publicPath) continue; // Salta percorsi undefined o null
  
  log('info', `Verifica percorso: ${publicPath}`);
  try {
    if (fs.existsSync(publicPath)) {
      foundPublicPath = publicPath;
      log('info', `✅ Cartella public trovata: ${publicPath}`);
      
      // Lista contenuto per verifica
      log('debug', 'Contenuto della cartella public:');
      fs.readdirSync(publicPath).forEach(file => {
        log('debug', `- ${file}`);
      });
      
      app.use(express.static(publicPath));
      break;
    }
  } catch (err) {
    log('error', `Errore durante la verifica del percorso ${publicPath}: ${err.message}`);
  }
}

if (!foundPublicPath) {
  log('error', '❌ Impossibile trovare la cartella public!');
  
  // Tenta di copiare la cartella public in una posizione accessibile
  const sourcePath = path.join(process.cwd(), 'public');
  const targetPath = path.join(__dirname, 'public');
  
  if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
    log('info', `Tentativo di copiare public da ${sourcePath} a ${targetPath}...`);
    try {
      fs.mkdirSync(targetPath, { recursive: true });
      fs.readdirSync(sourcePath).forEach(file => {
        const sourceFile = path.join(sourcePath, file);
        const targetFile = path.join(targetPath, file);
        fs.copyFileSync(sourceFile, targetFile);
        log('debug', `Copiato: ${file}`);
      });
      log('info', '✅ Cartella public copiata con successo');
      foundPublicPath = targetPath;
      app.use(express.static(targetPath));
    } catch (err) {
      log('error', `Errore durante la copia: ${err.message}`);
    }
  }
}

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.USE_MEMORY_DB === 'false' ? 'In-Memory' : 'PostgreSQL',
    paths: {
      __dirname,
      cwd: process.cwd(),
      foundPublicPath
    }
  });
});

// Importa direttamente il server già pronto da routes.js
import('./server/routes.js')
  .then((module) => {
    console.log('✅ Logica avanzata server caricata da server/routes.js');

    // 1) registra tutte le rotte sull'app Express
    if (typeof module.registerRoutes === 'function') {
      module.registerRoutes(app);
    } else {
      throw new Error('registerRoutes non è una funzione esportata da routes.js');
    }
    
// definisco la porta
const PORT = process.env.PORT || 10000;

// lancio il server una sola volta
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server IASE in esecuzione sulla porta ${PORT}`);
  console.log(`✅ Modalità: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Database: ${process.env.USE_MEMORY_DB==='true'?'In-Memory':'PostgreSQL'}`);
});
    // 2) avvia il server Express sulla porta definita
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server IASE in esecuzione sulla porta ${PORT}`);
      console.log(`✅ Modalità: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Database: ${process.env.USE_MEMORY_DB === 'true' ? 'In-Memory' : 'PostgreSQL'}`);
    });
  })
  .catch(err => {
    console.error('❌ Errore nel caricamento di server/routes.js:', err);
  });

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––


// – SPA fallback – skip all /api routes:
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();          // passa al router /api/...
  }
  // altrimenti serviamo l’index.html della SPA
  const indexHtml = path.join(foundPublicPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  res.status(404).send('Page not found');
});
