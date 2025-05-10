/**
 * IASE Project - Fix per Neon Database
 * 
 * Questo file configura esplicitamente il client Neon per evitare errori
 * quando la connessione al database non è necessaria.
 */

// Imposta queste variabili in modo esplicito come richiesto dall'errore
process.env.PGHOST = 'localhost';
process.env.PGUSER = 'localuser';
process.env.PGDATABASE = 'localdb';
process.env.PGPASSWORD = 'localpass';

// Esportazione vuota - serve solo per essere importato all'inizio dell'app
export default { initialized: true };