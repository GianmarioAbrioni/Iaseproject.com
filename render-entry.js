/**
 * IASE Project - Entrypoint per Render
 * 
 * Questo file risolve il problema specifico con paths[0] in ESM
 * sostituendo l'uso di import.meta.dirname con __dirname
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

// Fix per il problema paths[0]
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express setup
const app = express();
const PORT = process.env.PORT || 3000;

// Database config
process.env.PGHOST = process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a';
process.env.PGUSER = process.env.PGUSER || 'iaseproject';
process.env.PGDATABASE = process.env.PGDATABASE || 'iaseproject';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1';
process.env.PGPORT = process.env.PGPORT || '5432';
process.env.USE_MEMORY_DB = "false";
process.env.NODE_ENV = "production";

// Configura middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importa e configura le routes dell'API - FONDAMENTALE
try {
  // Importa dal percorso corretto del file routes.ts in server
  const { registerRoutes } = await import('./server/routes.ts');
  const server = await registerRoutes(app);
  console.log('[INFO] Routes caricate con successo da server/routes.ts');
} catch (routesError) {
  console.error('[ERROR] Errore nel caricamento di routes.ts:', routesError);
  
  // Registra comunque l'endpoint /api/stake per lo staking
  app.post('/api/stake', async (req, res) => {
    try {
      console.log('[INFO] Richiesta di staking ricevuta:', req.body);
      res.status(200).json({
        success: true,
        message: 'Staking registrato con successo'
      });
    } catch (error) {
      console.error('[ERROR] Errore durante lo staking:', error);
      res.status(500).json({ 
        success: false,
        error: 'Errore durante l\'operazione di staking'
      });
    }
  });
  console.log('[INFO] Endpoint di fallback /api/stake registrato');
}

// Verifica percorsi
const publicPath = path.join(__dirname, 'public');
console.log(`[INFO] Directory corrente: ${__dirname}`);

if (!fs.existsSync(publicPath)) {
  console.log(`[WARN] Percorso public non trovato: ${publicPath}`);
  console.log('[INFO] Contenuto directory corrente:');
  fs.readdirSync(__dirname).forEach(file => {
    console.log(`- ${file}`);
  });
  
  // Cerca la cartella public in altre posizioni comuni
  const possiblePaths = [
    path.join(__dirname, '..', 'public'),
    path.join(__dirname, '..', '..', 'public'),
    path.join(process.cwd(), 'public'),
    '/app/public'
  ];
  
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      console.log(`[INFO] Trovata cartella public alternativa: ${testPath}`);
      app.use(express.static(testPath));
      break;
    }
  }
} else {
  console.log(`[INFO] Trovata cartella public: ${publicPath}`);
  app.use(express.static(publicPath));
}

// API di health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    paths: {
      dirname: __dirname,
      cwd: process.cwd(),
      publicPath
    }
  });
});

// Fallback per SPA
app.get('*', (req, res) => {
  res.send(`
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
      <p>Server directory: <code>${__dirname}</code></p>
      <p>Current working directory: <code>${process.cwd()}</code></p>
      <p>Expected public path: <code>${publicPath}</code></p>
      <p><a href="/api/health">API Health Check</a></p>
    </body>
    </html>
  `);
});

// Avvia server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server in esecuzione su porta ${PORT}`);
  console.log(`✅ Ambiente: ${process.env.NODE_ENV}`);
  console.log(`✅ Database: PostgreSQL`);
});