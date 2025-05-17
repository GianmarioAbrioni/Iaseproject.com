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
import { registerRoutes } from './routes-loader.js';

// Fix per __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione server
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // <-- VA PRIMA di registerRoutes
app.use(express.urlencoded({ extended: true }));

registerRoutes(app); // <-- VA DOPO
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

// Serve static files
app.use(express.static(publicPath));
app.use(express.json());

// Health check API
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

// Fallback per single page app
app.get('*', (req, res) => {
  // Serve index.html per qualsiasi percorso non trovato
  if (fs.existsSync(path.join(publicPath, 'index.html'))) {
    res.sendFile(path.join(publicPath, 'index.html'));
  } else {
    res.status(404).send('Page not found');
  }
});

// Avvio server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server IASE in esecuzione sulla porta ${PORT}`);
  console.log(`✅ Modalità: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Database: ${process.env.USE_MEMORY_DB === 'true' ? 'In-Memory' : 'PostgreSQL'}`);
});