/**
 * IASE Project - Configurazione PostgreSQL
 *
 * Configurazione standard per la connessione al database PostgreSQL su Render.
 * Usa il driver pg standard (non Neon) per massima compatibilità.
 */
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Configurazione SSL per Render
const isProduction = process.env.NODE_ENV === 'production';
const sslConfig = isProduction ? { rejectUnauthorized: false } : false;

// Configurazione di connessione PostgreSQL
const pgConfig = {
  // Usa DATABASE_URL se specificato, altrimenti configura per l'interno di Render
  connectionString: process.env.DATABASE_URL || "postgresql://iaseproject:GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1@dpg-d0ff45buibrs73ekrt6g-a/iaseproject",
  // Impostazioni di connessione
  max: 20, // massimo numero di client nel pool
  idleTimeoutMillis: 30000, // tempo massimo di inattività
  connectionTimeoutMillis: 10000, // timeout connessione
  ssl: sslConfig
};

// Verifica presenza variabile ambiente DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL non impostata - utilizzando configurazione interna");
}

// Inizializza il pool di connessione PostgreSQL
console.log("📊 Inizializzazione connessione al database PostgreSQL");
export const pool = new pg.Pool(pgConfig);

// Test connessione al database
pool.query('SELECT NOW()')
  .then(res => {
    console.log(`✅ Connessione al database PostgreSQL stabilita: ${res.rows[0].now}`);
  })
  .catch(err => {
    console.error(`❌ Errore di connessione al database: ${err.message}`);
    
    // Registra dettagli di connessione per debug (senza esporre la password)
    const configForLog = { ...pgConfig };
    if (configForLog.connectionString) {
      configForLog.connectionString = configForLog.connectionString.replace(/:[^:@]*@/, ':***@');
    }
    console.log('ℹ️ Configurazione connessione:', configForLog);
  });

// Configura Drizzle ORM
export const db = drizzle(pool, { schema });
