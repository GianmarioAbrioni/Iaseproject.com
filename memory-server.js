/**
 * IASE Project - Server con Storage In-Memory
 * 
 * Versione speciale del server che utilizza storage in memoria 
 * con persistenza su file JSON.
 */

import express from 'express';
import session from 'express-session';
import { inMemoryDb } from './server/in-memory-db.js';
import { setupAuth } from './server/auth.js';
import { setupClaimRoutes } from './server/services/claim-service.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';

// Configurazione ambiente
process.env.USE_MEMORY_DB = "true";
process.env.NODE_ENV = "production";

// Info iniziali
console.log("🚀 IASE Project - Server In-Memory");
console.log("⚙️ Storage in memoria con persistenza su file JSON");
console.log("🌐 Ambiente: Production");

// Setup base Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessioni
const SESSION_SECRET = process.env.SESSION_SECRET || 'iase-project-secret-key';
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: inMemoryDb.persistence ? inMemoryDb.persistence.sessionStore : undefined,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 ore
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Setup autenticazione
setupAuth(app);

// Setup routes API
setupClaimRoutes(app, inMemoryDb);

// Log richieste API
app.use('/api', (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Route di test persistenza
app.get('/api/test/memory-stats', (req, res) => {
  const stats = {
    users: inMemoryDb.users.length,
    nftStakes: inMemoryDb.nftStakes.length,
    stakingRewards: inMemoryDb.stakingRewards.length,
    nftTraits: inMemoryDb.nftTraits.length,
    persistenceActive: !!inMemoryDb.persistence,
    lastSaveTime: inMemoryDb.persistence ? new Date(inMemoryDb.persistence.lastSaveTime).toISOString() : null
  };
  res.json(stats);
});

// Serve file statici
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Cattura tutte le altre richieste GET e servi index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Gestione errori
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Si è verificato un errore interno',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Avvio server
const port = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server avviato sulla porta ${port}`);
  console.log(`📂 Persistenza dati attiva: ${!!inMemoryDb.persistence}`);
});