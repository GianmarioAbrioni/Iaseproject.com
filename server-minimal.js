/**
 * IASE Project - Server minimo per Render
 * 
 * Versione ultra-semplificata che evita l'errore specifico con path[0]
 */

// Setup standard per eseguire su Render
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup DB
process.env.PGHOST = process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a';
process.env.PGUSER = process.env.PGUSER || 'iaseproject';
process.env.PGDATABASE = process.env.PGDATABASE || 'iaseproject';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1';
process.env.PGPORT = process.env.PGPORT || '5432';
process.env.USE_MEMORY_DB = "false";
process.env.NODE_ENV = "production";

// Path setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Express setup basilare (senza import dinamici che causano errori)
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Route base
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Avvia il server
http.createServer(app).listen(PORT, '0.0.0.0', () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
  console.log("Database: PostgreSQL");
});