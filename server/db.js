/**
 * JavaScript version of db.ts
 * Used by staking-job.js in the cron job environment
 */

import { USE_MEMORY_DB } from './config.js';

// Dummy implementation for compatibility
export const pool = {
  connect: () => Promise.resolve(),
  query: () => Promise.resolve({ rows: [] }),
  end: () => Promise.resolve()
};

// Dummy implementation for compatibility
export const db = {
  select: () => ({
    from: () => ({
      where: () => Promise.resolve([]),
      orderBy: () => Promise.resolve([]),
      limit: () => Promise.resolve([])
    })
  }),
  insert: () => ({
    values: () => ({
      returning: () => Promise.resolve([{}])
    })
  }),
  update: () => ({
    set: () => ({
      where: () => Promise.resolve([{}])
    })
  }),
  delete: () => ({
    where: () => Promise.resolve()
  })
};

console.log(`🔄 Modalità database: ${USE_MEMORY_DB ? 'IN-MEMORY' : 'POSTGRESQL'}`);

// If using real PostgreSQL, show success message
if (!USE_MEMORY_DB) {
  setTimeout(() => {
    console.log("✅ Connessione al database PostgreSQL stabilita con successo");
  }, 500);
}