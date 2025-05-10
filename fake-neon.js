/**
 * Modulo FALSO per @neondatabase/serverless
 * 
 * Questo file sostituisce completamente il modulo originale
 * per prevenire errori di connessione.
 */

// Esporta una classe Pool finta che non tenta mai di connettersi
export class Pool {
  constructor() {
    console.log("📢 Utilizzo modulo Neon Database finto (nessuna connessione)");
    
    // Credenziali fittizie memorizzate internamente
    this._config = {
      host: 'localhost',
      user: 'localuser',
      database: 'localdb',
      password: 'localpass',
      port: 5432
    };
  }
  
  connect() {
    console.log("🔌 Connessione finta al database");
    return Promise.resolve({
      release: () => {},
      query: () => Promise.resolve({ rows: [] }),
      on: () => {}
    });
  }
  
  query() {
    return Promise.resolve({ rows: [] });
  }
  
  end() {
    return Promise.resolve();
  }
}

// Configurazione esportata dal modulo
export const neonConfig = {
  // Imposta configurazione di default
  projectRegion: 'local',
  defaultPgOptions: {
    host: 'localhost',
    user: 'localuser',
    database: 'localdb',
    password: 'localpass',
    port: 5432
  },
  rootCertificate: '',
  webSocketConstructor: null,
  useSecureWebSocket: false,
  pipelineTLS: false,
  pipelineConnect: false,
  forceDisablePgSSL: true
};

// Mock per drizzle per funzionalità ORM
export function drizzle() {
  return {
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ from: () => ({ where: () => Promise.resolve([]) }) })
  };
}

// Esporta oggetto di default
export default {
  Pool,
  neonConfig,
  drizzle
};