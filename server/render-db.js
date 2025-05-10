/**
 * IASE Project - Configurazione PostgreSQL per Render
 * 
 * Configurazione specifica per la connessione al database PostgreSQL su Render.
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema.js';

// Configurazione di connessione
const renderConnectionConfig = {
  // Usa DATABASE_URL se specificato, altrimenti configurazione interna per Render
  connectionString: process.env.DATABASE_URL || "postgresql://iaseproject:GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1@dpg-d0ff45buibrs73ekrt6g-a/iaseproject",
  
  // Configurazione alternativa diretta (se dovesse fallire il connectionString)
  host: process.env.PGHOST || "dpg-d0ff45buibrs73ekrt6g-a",
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || "iaseproject",
  user: process.env.PGUSER || "iaseproject",
  password: process.env.PGPASSWORD || "GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1",
  
  // Configurazione SSL necessaria per Render
  ssl: {
    rejectUnauthorized: false
  }
};

// Inizializza il pool di connessione PostgreSQL
const pool = new pg.Pool(renderConnectionConfig);

// Connessione di test
pool.query('SELECT NOW()')
  .then(res => {
    console.log(`✅ Connessione al database PostgreSQL su Render stabilita: ${res.rows[0].now}`);
  })
  .catch(err => {
    console.error(`❌ Errore di connessione al database: ${err.message}`);
  });

// Configurazione Drizzle ORM
const db = drizzle(pool, { schema });

export { pool, db };