/**
 * Questo file risolve il problema con il modulo @neondatabase/serverless
 * che fallisce quando non viene fornito un DATABASE_URL.
 * 
 * Sovrascrive completamente le funzionalità originali del modulo.
 */

// Inserisci questo file nella cartella node_modules/@neondatabase/serverless
// per bypassare completamente il modulo originale

import { EventEmitter } from 'events';

// Finge di avere una connessione a PostgreSQL ma non fa nulla
class MockClient extends EventEmitter {
  constructor() {
    super();
    this.connected = true;
  }
  
  query() {
    return Promise.resolve({ rows: [] });
  }
  
  end() {
    this.connected = false;
    return Promise.resolve();
  }
}

// Sostituzione finta del modulo Pool di pg
export class Pool {
  constructor() {
    console.log("🔧 Using mock Neon database pool");
    this._clients = [];
    this._available = [];
    this._queue = [];
  }
  
  connect() {
    const client = new MockClient();
    this._clients.push(client);
    return Promise.resolve(client);
  }
  
  end() {
    return Promise.resolve();
  }
  
  query() {
    return Promise.resolve({ rows: [] });
  }
}

// Configurazione vuota per neon
export const neonConfig = {
  projectRegion: 'local',
  defaultPgOptions: {},
  rootCertificate: '',
  webSocketConstructor: null,
  useSecureWebSocket: false,
  pipelineTLS: false,
  pipelineConnect: false,
  forceDisablePgSSL: false,
};

// Drizzle wrapper vuoto
export function drizzle() {
  return {
    query: () => Promise.resolve([]),
    select: () => ({ from: () => [] }),
    insert: () => ({ values: () => ({ returning: () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
    delete: () => ({ where: () => ({ returning: () => [] }) }),
  };
}