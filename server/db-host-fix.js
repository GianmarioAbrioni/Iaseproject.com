/**
 * IASE Project - Fix per host esplicitamente impostato a 'localhost'
 * 
 * Questo file deve essere importato PRIMA di qualsiasi utilizzo di @neondatabase/serverless
 * per evitare l'errore "set the host to 'localhost' explicitly".
 */

// Imposta esplicitamente tutte le variabili d'ambiente richieste
process.env.PGHOST = 'localhost';
process.env.PGUSER = process.env.PGUSER || 'localuser';
process.env.PGDATABASE = process.env.PGDATABASE || 'localdb';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'localpass';

// Per sicurezza imposta anche DATABASE_URL
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:5432/${process.env.PGDATABASE}`;
}

console.log("🔧 IASE Project - Fix host database: PGHOST=localhost impostato esplicitamente");