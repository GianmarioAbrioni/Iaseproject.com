/**
 * IASE Project - Test di connessione al database
 * 
 * Script per verificare la connessione al database PostgreSQL su Render.
 */

import pg from 'pg';

console.log("🧪 Test di connessione al database PostgreSQL");

// Configurazione SSL per Render
const sslConfig = { rejectUnauthorized: false };

// Configurazione di connessione interna (su Render)
const pgConfigInternal = {
  // Connessione interna
  connectionString: "postgresql://iaseproject:GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1@dpg-d0ff45buibrs73ekrt6g-a/iaseproject",
  ssl: sslConfig
};

// Connessione alternativa esterna (da fuori Render)
const pgConfigExternal = {
  connectionString: "postgresql://iaseproject:GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1@dpg-d0ff45buibrs73ekrt6g-a.oregon-postgres.render.com/iaseproject",
  ssl: sslConfig
};

// Configurazione diretta con i parametri espliciti
const pgConfigDirect = {
  host: "dpg-d0ff45buibrs73ekrt6g-a.oregon-postgres.render.com", // host esterno per test locale
  port: 5432,
  database: "iaseproject",
  user: "iaseproject",
  password: "GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1",
  ssl: sslConfig
};

// Test con connessione interna (uso su Render)
console.log("📊 Test di connessione interna (Render)...");
const pool1 = new pg.Pool(pgConfigInternal);

pool1.query('SELECT NOW() as time')
  .then(res => {
    console.log(`✅ Connessione interna stabilita: ${res.rows[0].time}`);
    pool1.end();
    testExternal();
  })
  .catch(err => {
    console.error(`❌ Errore connessione interna: ${err.message}`);
    console.log("   Questo è normale se stai eseguendo il test localmente e non su Render");
    pool1.end();
    testExternal();
  });

// Test con connessione esterna
function testExternal() {
  console.log("\n📊 Test di connessione esterna...");
  const pool2 = new pg.Pool(pgConfigExternal);
  
  pool2.query('SELECT NOW() as time')
    .then(res => {
      console.log(`✅ Connessione esterna stabilita: ${res.rows[0].time}`);
      pool2.end();
      testDirect();
    })
    .catch(err => {
      console.error(`❌ Errore connessione esterna: ${err.message}`);
      pool2.end();
      testDirect();
    });
}

// Test con connessione diretta
function testDirect() {
  console.log("\n📊 Test di connessione diretta...");
  const pool3 = new pg.Pool(pgConfigDirect);
  
  pool3.query('SELECT NOW() as time')
    .then(res => {
      console.log(`✅ Connessione diretta stabilita: ${res.rows[0].time}`);
      pool3.end();
      testTables();
    })
    .catch(err => {
      console.error(`❌ Errore connessione diretta: ${err.message}`);
      pool3.end();
      testTables();
    });
}

// Test di lettura tabelle
function testTables() {
  console.log("\n📊 Test di lettura tabelle...");
  const pool4 = new pg.Pool(pgConfigDirect);
  
  pool4.query(`
    SELECT 
      table_name 
    FROM 
      information_schema.tables 
    WHERE 
      table_schema = 'public'
  `)
    .then(res => {
      console.log(`✅ Tabelle trovate: ${res.rows.length}`);
      console.log(res.rows.map(row => row.table_name).join(', '));
      pool4.end();
      console.log("\n✅ Test completato con successo!");
    })
    .catch(err => {
      console.error(`❌ Errore lettura tabelle: ${err.message}`);
      pool4.end();
      console.log("\n❌ Test fallito!");
    });
}