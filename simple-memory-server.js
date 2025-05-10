/**
 * IASE Project - Server In-Memory semplificato
 * 
 * Versione minimale che serve solo i file statici.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';

// Info iniziali
console.log("🚀 IASE Project - Simple In-Memory Server");
console.log("🌐 Ambiente: Production");

// Setup base Express
const app = express();
app.use(express.json());

// Serve file statici
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.join(__dirname, 'public');

console.log(`📁 Servizio file statici da: ${publicPath}`);
app.use(express.static(publicPath));

// Route di test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup directory dati per persistenza
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Directory dati creata: ${dataDir}`);
}

// Cattura tutte le altre richieste GET e servi index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Gestione errori
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Si è verificato un errore interno',
    message: err.message
  });
});

// Avvio server
const port = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server avviato sulla porta ${port}`);
});