/**
 * IASE Project - Launcher con storage in memoria
 * 
 * Questo script avvia l'applicazione in modalità storage in memoria
 * senza necessità di database PostgreSQL.
 * 
 * Uso: node start-memory.js
 */

// Imposta le variabili d'ambiente
process.env.USE_MEMORY_DB = "true";
process.env.NODE_ENV = "production";

// Avvia l'applicazione
console.log("🚀 Avvio IASE Project in modalità IN-MEMORY");
console.log("📋 Nessun database PostgreSQL richiesto");

// Importa il server
import("./server/index.js")
  .then(() => {
    console.log("✅ Applicazione avviata con successo");
  })
  .catch(err => {
    console.error("❌ Errore durante l'avvio:", err);
  });