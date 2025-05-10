import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Verifica presenza variabile ambiente DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("⚠️ DATABASE_URL non impostata - utilizzando database interno");
}

// Pool di connessione
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // massimo numero di client nel pool
  idleTimeoutMillis: 30000, // tempo massimo di inattività
  connectionTimeoutMillis: 10000 // timeout connessione
});

// Test connessione al database
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Connessione al database PostgreSQL stabilita con successo'))
  .catch(err => {
    console.error('⚠️ Connessione database:', err.message);
    console.log('ℹ️ Il database verrà configurato automaticamente su Render');
  });

export const db = drizzle({ client: pool, schema });
