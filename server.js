/**
 * IASE Project - Server Entry Point
 * 
 * Questo file avvia l'applicazione IASE Project in modalità compatibile con Render.
 * Utilizza lo storage in memoria con persistenza su file per funzionare 
 * senza dipendenze PostgreSQL mantenendo i dati tra riavvii.
 */

// FIX IMPORTANTE: Imposta esplicitamente 'localhost' come host di database
// come richiesto dall'errore in Render "please set the host to 'localhost' explicitly"
process.env.PGHOST = 'localhost';
process.env.PGUSER = 'localuser';
process.env.PGDATABASE = 'localdb';
process.env.PGPASSWORD = 'localpass';
process.env.DATABASE_URL = 'postgresql://localuser:localpass@localhost:5432/localdb';

// Imposta le variabili d'ambiente per la modalità in-memory
process.env.USE_MEMORY_DB = "true";
process.env.NODE_ENV = "production";

// Stampa le informazioni di avvio
console.log("🚀 Avvio IASE Project");
console.log("⚙️ Modalità: IN-MEMORY storage con persistenza su file");
console.log("🌐 Ambiente: PRODUCTION");
console.log("📂 I dati vengono automaticamente salvati e ripristinati tra riavvii");

// Importa il server
import("./server/index-no-db.ts")
  .then(() => {
    console.log("✅ Applicazione avviata con successo");
  })
  .catch((err) => {
    console.error("❌ Errore durante l'avvio:", err);
    process.exit(1);
  });