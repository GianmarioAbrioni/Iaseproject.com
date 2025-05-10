/**
 * IASE Project - Configurazione standard PostgreSQL
 * 
 * Questo file utilizza il driver pg standard invece di @neondatabase/serverless
 * per evitare problemi di connessione su Render.
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/pg-core';
import * as schema from '../shared/schema.js';

// Connessione al database
function createDbConnection() {
  console.log("📊 Inizializzazione connessione database PostgreSQL standard");
  
  // Verifica se esiste DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL non trovato, verifica le variabili d'ambiente");
  }
  
  // Opzioni di connessione
  const connectionOptions = {
    // Se abbiamo DATABASE_URL, lo usiamo
    connectionString: process.env.DATABASE_URL,
    // Opzioni SSL per ambienti di produzione
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
  
  console.log("🔌 Connessione a PostgreSQL con configurazione standard");
  
  // Crea pool di connessione
  const pool = new pg.Pool(connectionOptions);
  
  // Gestione errori di connessione
  pool.on('error', (err) => {
    console.error('⚠️ Errore imprevisto nel pool di connessione:', err.message);
  });
  
  // Test di connessione
  pool.query('SELECT NOW()')
    .then(res => {
      console.log(`✅ Connessione al database PostgreSQL stabilita: ${res.rows[0].now}`);
    })
    .catch(err => {
      console.error(`❌ Errore di connessione al database: ${err.message}`);
    });
  
  return pool;
}

// Crea connessione al database
const pool = createDbConnection();

// Configura Drizzle ORM
const db = drizzle(pool, { schema });

export { pool, db };