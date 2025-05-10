/**
 * Session Store in memoria per IASE Project
 * 
 * Implementazione semplice di un session store in memoria per Express
 * compatibile con express-session.
 */

import memorystore from 'memorystore';
import session from 'express-session';

export function createSessionStore() {
  const MemoryStore = memorystore(session);
  
  return new MemoryStore({
    checkPeriod: 86400000 // Pulizia sessioni scadute ogni 24h
  });
}