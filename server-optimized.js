/**
 * IASE Project - Server ottimizzato per Render
 * 
 * Versione semplificata e ottimizzata del server per migliorare le performance
 * su Render eliminando le parti non necessarie.
 */

// Importazioni essenziali
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

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
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Express setup ottimizzato
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // più leggero di extended: true
const PORT = process.env.PORT || 3000;

// Configurazione Cache per migliorare le performance
app.use((req, res, next) => {
  // Cache statica per un'ora (3600 secondi)
  if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});

// Trova public path nel modo più veloce possibile
const publicPaths = [
  process.env.PUBLIC_PATH,
  path.join(__dirname, 'public'),
  path.join(process.cwd(), 'public'),
  '/app/public',
  '/opt/render/project/src/public'
];

let foundPublicPath = null;
for (const publicPath of publicPaths) {
  if (publicPath && fs.existsSync(publicPath)) {
    foundPublicPath = publicPath;
    console.log(`[INFO] Cartella public trovata: ${publicPath}`);
    
    // Configurazioni ottimizzate per file statici
    app.use(express.static(publicPath, {
      maxAge: '1d', // Cache browser di 1 giorno
      etag: true,   // Usa ETag per caching efficiente
      lastModified: true, // Usa Last-Modified header
    }));
    break;
  }
}

if (!foundPublicPath) {
  console.error('[ERROR] Impossibile trovare la cartella public!');
}

// API di health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

// Fallback per SPA - configurazione ottimizzata
app.get('*', (req, res) => {
  if (foundPublicPath && fs.existsSync(path.join(foundPublicPath, 'index.html'))) {
    // Cache per 5 minuti per index.html (meno delle risorse statiche)
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.sendFile(path.join(foundPublicPath, 'index.html'));
  } else {
    res.status(404).send('Page not found');
  }
});

// Avvio server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] Server in esecuzione su porta ${PORT}`);
  console.log(`[INFO] Ambiente: ${process.env.NODE_ENV}`);
});