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

// Fix per __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(`[INFO] Directory corrente: ${__dirname}`);

// Configurazione database
process.env.PGHOST = process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a';
process.env.PGUSER = process.env.PGUSER || 'iaseproject';
process.env.PGDATABASE = process.env.PGDATABASE || 'iaseproject';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1';
process.env.PGPORT = process.env.PGPORT || '5432';
process.env.USE_MEMORY_DB = process.env.USE_MEMORY_DB || "false";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Express setup
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// Verifica percorsi e serve file statici
const publicPaths = [
  path.join(__dirname, 'public'),
  path.join(__dirname, '..', 'public'),
  path.join(process.cwd(), 'public')
];

let foundPublicPath = null;
for (const publicPath of publicPaths) {
  console.log(`[INFO] Verifica percorso: ${publicPath}`);
  if (fs.existsSync(publicPath)) {
    foundPublicPath = publicPath;
    console.log(`[INFO] ✅ Cartella public trovata: ${publicPath}`);
    app.use(express.static(publicPath));
    break;
  }
}

if (!foundPublicPath) {
  console.error('[ERROR] ❌ Impossibile trovare la cartella public!');
  console.log('[INFO] Directory disponibili:');
  fs.readdirSync(__dirname).forEach(file => {
    console.log(`- ${file}`);
  });
}

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.USE_MEMORY_DB === 'true' ? 'In-Memory' : 'PostgreSQL',
    paths: {
      __dirname,
      cwd: process.cwd(),
      foundPublicPath
    }
  });
});

// Fallback per SPA
app.get('*', (req, res) => {
  if (foundPublicPath && fs.existsSync(path.join(foundPublicPath, 'index.html'))) {
    res.sendFile(path.join(foundPublicPath, 'index.html'));
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>IASE Project</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
          pre { background: #f1f1f1; padding: 1rem; border-radius: 4px; overflow: auto; }
        </style>
      </head>
      <body>
        <h1>IASE Project - Server Running</h1>
        <p>The server is running but the static files could not be found.</p>
        <p>Check the server logs for more information.</p>
        <p>Public path search:</p>
        <ul>
          ${publicPaths.map(p => `<li>${p} - ${fs.existsSync(p) ? '✅ Found' : '❌ Not found'}</li>`).join('')}
        </ul>
        <p><a href="/api/health">API Health Check</a></p>
      </body>
      </html>
    `);
  }
});

// Avvia server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] ✅ Server in esecuzione su porta ${PORT}`);
  console.log(`[INFO] ✅ Ambiente: ${process.env.NODE_ENV}`);
  console.log(`[INFO] ✅ Database: ${process.env.USE_MEMORY_DB === 'true' ? 'In-Memory' : 'PostgreSQL'}`);
});