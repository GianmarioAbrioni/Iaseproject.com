/**
 * IASE Project - Staking Verification Job (PostgreSQL)
 * 
 * Versione del job di verifica che utilizza il database PostgreSQL
 * invece dello storage in memoria per massima compatibilità con Render.
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
console.log("🔄 IASE Project - Job Verifica Staking con PostgreSQL");
console.log("⚙️ Modalità: Database PostgreSQL");
console.log("🌐 Ambiente: PRODUCTION");
console.log(`📊 Database: ${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`);

// Importa il modulo di verifica
import('./server/services/staking-job.js')
  .then(module => {
    // Esegui la verifica
    module.default()
      .then(() => {
        console.log("✅ Verifica completata con successo");
        process.exit(0);
      })
      .catch(error => {
        console.error("❌ Errore durante la verifica:", error);
        process.exit(1);
      });
  })
  .catch(err => {
    console.error("❌ Errore durante l'importazione del modulo:", err);
    process.exit(1);
  });