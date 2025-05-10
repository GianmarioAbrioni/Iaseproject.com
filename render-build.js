/**
 * IASE Project - Script di build per Render
 * 
 * Questo script genera un bundle corretto per Render
 * evitando problemi con import.meta.url
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Esegui la build standard
console.log('📦 Esecuzione build standard...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completata con successo');
} catch (error) {
  console.error('❌ Errore durante la build:', error);
  process.exit(1);
}

// Verifica se esiste il file dist/index.js
const indexPath = path.join(__dirname, 'dist', 'index.js');
if (!fs.existsSync(indexPath)) {
  console.error('❌ File dist/index.js non trovato dopo la build');
  process.exit(1);
}

// Leggi il contenuto del file
let content = fs.readFileSync(indexPath, 'utf8');

// Patch per import.meta.url
console.log('🔧 Applicazione patch per import.meta.url...');
content = content.replace(
  /import\.meta\.url/g,
  '"file://" + __filename'
);

// Patch per __dirname
console.log('🔧 Aggiunta definizione di __dirname...');
const dirnameDefinition = `
// Fix per __dirname e __filename in ESM
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`;

// Inserisci la definizione all'inizio del file dopo gli import esistenti
const importEndIndex = content.lastIndexOf('import');
if (importEndIndex !== -1) {
  // Trova la fine dell'ultimo import statement
  const semicolonAfterImport = content.indexOf(';', importEndIndex);
  if (semicolonAfterImport !== -1) {
    content = content.slice(0, semicolonAfterImport + 1) + 
              dirnameDefinition + 
              content.slice(semicolonAfterImport + 1);
  } else {
    content = dirnameDefinition + content;
  }
} else {
  content = dirnameDefinition + content;
}

// Salva il file modificato
fs.writeFileSync(indexPath, content);
console.log('✅ Patch applicate correttamente a dist/index.js');

// Verifica se la cartella public è inclusa nella dist
const distPublicPath = path.join(__dirname, 'dist', 'public');
const publicPath = path.join(__dirname, 'public');

if (!fs.existsSync(distPublicPath) && fs.existsSync(publicPath)) {
  console.log('📂 Copia della cartella public nella dist...');
  execSync(`cp -r ${publicPath} ${path.join(__dirname, 'dist')}`);
  console.log('✅ Cartella public copiata correttamente');
}

console.log('🚀 Build per Render completata con successo!');