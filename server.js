/**
 * IASE Project - Server Entry Point
 *
 * Questo file avvia l'applicazione IASE Project in modalità compatibile con Render.
 * Utilizza lo storage impostato tramite variabili d'ambiente (PostgreSQL o memoria).
 */

// NON impostare PGHOST, PGUSER, PGDATABASE, PGPASSWORD o DATABASE_URL qui!
// Queste vengono automaticamente fornite da Render

// Configura solo modalità di esecuzione e debug
process.env.USE_MEMORY_DB = process.env.USE_MEMORY_DB || "false";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Stampa informazioni iniziali
console.log("🚀 Avvio IASE Project");
console.log(`⚙️ Modalità: ${process.env.USE_MEMORY_DB === "true" ? "in-memory" : "database PostgreSQL"}`);
console.log(`🌐 Ambiente: ${process.env.NODE_ENV}`);
console.log(`📁 I dati vengono salvati su ${process.env.USE_MEMORY_DB === "true" ? "memoria" : "database PostgreSQL"}`);

// Importa il server
import("./server/index.js")
  .then(() => {
    console.log("✅ Applicazione avviata con successo");
  })
  .catch((err) => {
    console.error("❌ Errore durante l'avvio:", err);
    process.exit(1);
  });