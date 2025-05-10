/**
 * IASE Project - Server Entry Point (PostgreSQL)
 * 
 * Questo file avvia l'applicazione IASE Project con PostgreSQL su Render.
 * Utilizza il database PostgreSQL come storage principale per tutte le operazioni.
 */

// FIX IMPORTANTE: Imposta esplicitamente host di database
// come richiesto dall'errore in Render "please set the host to 'localhost' explicitly"
process.env.PGHOST = process.env.PGHOST || 'dpg-d0ff45buibrs73ekrt6g-a';
process.env.PGUSER = process.env.PGUSER || 'iaseproject';
process.env.PGDATABASE = process.env.PGDATABASE || 'iaseproject';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1';
process.env.PGPORT = process.env.PGPORT || '5432';

// Imposta DATABASE_URL se non è già impostato
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
}

// Imposta le variabili d'ambiente per la modalità PostgreSQL
process.env.USE_MEMORY_DB = "false"; // Usa PostgreSQL, non in-memory
process.env.NODE_ENV = "production";

// Stampa le informazioni di avvio
console.log("🚀 Avvio IASE Project");
console.log("⚙️ Modalità: POSTGRESQL Database");
console.log("🌐 Ambiente: PRODUCTION");
console.log(`📊 Database: ${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`);

// Importa il server standard (non quello no-db)
import("./server/index.ts")
  .then(() => {
    console.log("✅ Applicazione avviata con successo utilizzando PostgreSQL");
  })
  .catch((err) => {
    console.error("❌ Errore durante l'avvio:", err);
    process.exit(1);
  });