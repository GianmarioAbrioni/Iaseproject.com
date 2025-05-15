#!/bin/bash

# Script per installare correttamente Alchemy SDK e ethers.js durante il deploy su Render
# Versione 1.0.0 - 2025-05-15

echo "🔧 IASE - Installazione dipendenze Web3 per Render"
echo "=================================================="

# Verifica che npm sia disponibile
if ! command -v npm &> /dev/null; then
    echo "❌ ERRORE: npm non è disponibile"
    exit 1
fi

# Verifica la cartella corrente
echo "📂 Directory corrente: $(pwd)"
echo "📁 Contenuto directory:"
ls -la

# Installa ethers.js globalmente per assicurarsi che sia disponibile ovunque
echo "🔄 Installazione ethers.js (versione 5.7.2 per massima compatibilità)..."
npm install --save ethers@5.7.2

# Installa Alchemy SDK
echo "🔄 Installazione Alchemy SDK..."
npm install --save alchemy-sdk

# Crea una directory js se non esiste
mkdir -p public/js
mkdir -p client/public/js

# Crea un bundle ethers.js per il caricamento diretto nel browser
echo "🔄 Creazione bundle ethers.js per il browser..."
npx browserify -r ethers -o public/js/ethers-bundle.js
cp public/js/ethers-bundle.js client/public/js/ethers-bundle.js 2>/dev/null || :

# Crea un file di configurazione Alchemy
echo "🔄 Creazione file di configurazione Alchemy..."
cat > public/js/alchemy-config.js << EOL
/**
 * Configurazione Alchemy per IASE
 * Generato automaticamente durante il deploy
 */
window.ALCHEMY_API_KEY = window.ALCHEMY_API_KEY || "uAZ1tPYna9tBMfuTa616YwMcgptV_1vB";
window.ALCHEMY_NETWORK = "eth-mainnet";
window.ALCHEMY_CONFIG = {
  apiKey: window.ALCHEMY_API_KEY,
  network: window.ALCHEMY_NETWORK
};
EOL

cp public/js/alchemy-config.js client/public/js/alchemy-config.js 2>/dev/null || :

# Verifica se la configurazione è stata creata correttamente
if [ -f "public/js/alchemy-config.js" ]; then
  echo "✅ File di configurazione Alchemy creato con successo"
else
  echo "❌ ERRORE: Impossibile creare file di configurazione Alchemy"
fi

# Verifica se il bundle ethers.js è stato creato correttamente
if [ -f "public/js/ethers-bundle.js" ]; then
  echo "✅ Bundle ethers.js creato con successo"
else
  echo "❌ ERRORE: Impossibile creare bundle ethers.js"
fi

echo "✅ Installazione Web3 completata"
echo "=================================================="