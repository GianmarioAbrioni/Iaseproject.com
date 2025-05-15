#!/bin/bash

# Script pre-deploy che configura correttamente l'ambiente per Render
# Versione 2.0.0 - 2025-05-15 - Potenziato per supporto Alchemy e ethers.js
echo "🛠️ Esecuzione script pre-deploy avanzato per Render"

# Configurazione database fittizio (solo per build)
export PGHOST=localhost
export PGUSER=localuser
export PGDATABASE=localdb
export PGPASSWORD=localpass
export DATABASE_URL=postgresql://localuser:localpass@localhost:5432/localdb

# Verifica le variabili
echo "📊 Verifico variabili d'ambiente database:"
echo "PGHOST=$PGHOST"
echo "PGUSER=$PGUSER"
echo "PGDATABASE=$PGDATABASE"
echo "DATABASE_URL=$DATABASE_URL"

# Crea directory dati e public/js se non esistono
mkdir -p data
mkdir -p public/js
mkdir -p client/public/js 2>/dev/null || true
echo "📁 Directory necessarie create/verificate"

# Cerca file .env.alchemy e lo utilizza se esiste
if [ -f ".env.alchemy" ]; then
  echo "📝 Trovato file .env.alchemy, lo importo..."
  source .env.alchemy
  echo "✅ Configurazione Alchemy importata: API KEY=${ALCHEMY_API_KEY:0:4}...${ALCHEMY_API_KEY: -4}"
else
  echo "⚠️ File .env.alchemy non trovato, uso configurazione predefinita"
  # Usa valori predefiniti
  ALCHEMY_API_KEY="uAZ1tPYna9tBMfuTa616YwMcgptV_1vB"
  ALCHEMY_API_URL="https://eth-mainnet.g.alchemy.com/v2/uAZ1tPYna9tBMfuTa616YwMcgptV_1vB"
  ALCHEMY_ENHANCED_APIS="true"
  ALCHEMY_NETWORK="1"
  USE_ALCHEMY_API="true"
fi

# Cerca anche in assets
if [ ! -f ".env.alchemy" ] && [ -f "attached_assets/.env.alchemy" ]; then
  echo "📝 Trovato file attached_assets/.env.alchemy, lo copio..."
  cp attached_assets/.env.alchemy .env.alchemy
  source .env.alchemy
  echo "✅ Configurazione Alchemy importata da assets: API KEY=${ALCHEMY_API_KEY:0:4}...${ALCHEMY_API_KEY: -4}"
fi

# Configurazione variabili file di sistema
# Memorizza le variabili in un file per essere utilizzate da altri processi
cat > .env.local << EOL
PGHOST=localhost
PGUSER=localuser
PGDATABASE=localdb
PGPASSWORD=localpass
DATABASE_URL=postgresql://localuser:localpass@localhost:5432/localdb

# Configurazione Alchemy API per Web3
ALCHEMY_API_KEY=${ALCHEMY_API_KEY}
ALCHEMY_API_URL=${ALCHEMY_API_URL}
ALCHEMY_ENHANCED_APIS=${ALCHEMY_ENHANCED_APIS}
ALCHEMY_NETWORK=${ALCHEMY_NETWORK}
USE_ALCHEMY_API=${USE_ALCHEMY_API}
EOL

# Installa pacchetti necessari per Web3 non inclusi in package.json
echo "🔧 Verifico e installo dipendenze Web3 essenziali..."

# Verifica se ethers.js è installato
if npm list | grep -q "ethers"; then
  echo "✅ ethers.js già installato"
else
  echo "⚠️ ethers.js non trovato, installiamo versione compatibile (5.7.2)..."
  npm install --save ethers@5.7.2
fi

# Verifica se Alchemy SDK è installato
if npm list | grep -q "alchemy-sdk"; then
  echo "✅ Alchemy SDK già installato"
else
  echo "⚠️ Alchemy SDK non trovato, installiamo..."
  npm install --save alchemy-sdk
fi

# Verifica se browserify è installato (necessario per bundle)
if npm list -g | grep -q "browserify" || npm list | grep -q "browserify"; then
  echo "✅ browserify già installato"
else
  echo "⚠️ browserify non trovato, installiamo..."
  npm install --save-dev browserify
fi

# Crea file di inizializzazione Alchemy per inclusione diretta
echo "📝 Creazione file config Alchemy..."
cat > public/js/alchemy-config.js << EOL
/**
 * Configurazione Alchemy per IASE Project
 * Generato automaticamente durante il deploy - $(date)
 */
window.ALCHEMY_API_KEY = window.ALCHEMY_API_KEY || "uAZ1tPYna9tBMfuTa616YwMcgptV_1vB";
window.ALCHEMY_NETWORK = "eth-mainnet";
window.ALCHEMY_CONFIG = {
  apiKey: window.ALCHEMY_API_KEY,
  network: window.ALCHEMY_NETWORK
};
console.log("✅ Configurazione Alchemy caricata");
EOL

# Copia in client/public se esiste
cp public/js/alchemy-config.js client/public/js/ 2>/dev/null || true

# Cerca nei file HTML per verificare che i nuovi script siano inclusi
echo "🔍 Verifico inclusione script nei file HTML..."
MISSING_SCRIPTS=0

check_and_update_html() {
  local file=$1
  if [ -f "$file" ]; then
    echo "Verifico $file..."
    # Verifica se manca alchemy-config.js
    if ! grep -q "alchemy-config.js" "$file"; then
      echo "⚠️ File $file non include alchemy-config.js, lo aggiungeremo"
      MISSING_SCRIPTS=$((MISSING_SCRIPTS + 1))
    fi
    # Verifica se manca ethers-bundle.js (verrà creato da render-alchemy-install.sh)
    if ! grep -q "ethers-bundle.js" "$file"; then
      echo "⚠️ File $file non include ethers-bundle.js"
      MISSING_SCRIPTS=$((MISSING_SCRIPTS + 1))
    fi
  fi
}

# Controlla file HTML principali
check_and_update_html "public/staking.html"
check_and_update_html "public/index.html"
check_and_update_html "client/public/staking.html"

echo "📊 Risultato verifica script: trovati $MISSING_SCRIPTS script mancanti"
echo "ℹ️ Gli script necessari verranno generati da render-alchemy-install.sh"

echo "🚀 Configurazione pre-deploy completata!"
exit 0