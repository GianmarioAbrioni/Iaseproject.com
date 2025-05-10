/**
 * IASE Project - CommonJS Server Launcher
 * 
 * Questo file usa CommonJS (non ES Modules) per evitare
 * tutti i problemi con paths e import/export.
 */

// Impostazione variabili ambiente DB
process.env.PGHOST = process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a';
process.env.PGUSER = process.env.PGUSER || 'iaseproject';
process.env.PGDATABASE = process.env.PGDATABASE || 'iaseproject';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1';
process.env.PGPORT = process.env.PGPORT || '5432';
process.env.USE_MEMORY_DB = "false";
process.env.NODE_ENV = "production";

// Moduli base
const express = require('express');
const path = require('path');
const http = require('http');

// Server express base
const app = express();
const PORT = process.env.PORT || 3000;

// Servizio file statici
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Avvio server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server IASE in esecuzione sulla porta ${PORT}`);
  console.log(`Modalità database: PostgreSQL`);
});