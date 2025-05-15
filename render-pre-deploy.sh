#!/bin/bash

# Script pre-deploy che configura correttamente l'ambiente per Render
echo "🛠️ Esecuzione script pre-deploy per Render"

# Configurazione database fittizio
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

# Crea directory dati se non esiste
mkdir -p data
echo "📁 Directory data creata/verificata"

# Configurazione variabili file di sistema
# Memorizza le variabili in un file per essere utilizzate da altri processi
cat > .env.local << EOL
PGHOST=localhost
PGUSER=localuser
PGDATABASE=localdb
PGPASSWORD=localpass
DATABASE_URL=postgresql://localuser:localpass@localhost:5432/localdb

# Configurazione Alchemy API per Web3
ALCHEMY_API_KEY=uAZ1tPYna9tBMfuTa616YwMcgptV_1vB
ALCHEMY_API_URL=https://eth-mainnet.g.alchemy.com/v2/uAZ1tPYna9tBMfuTa616YwMcgptV_1vB
ALCHEMY_ENHANCED_APIS=true
ALCHEMY_NETWORK=1
EOL

# Verifica se Alchemy SDK è installato
echo "🔍 Verifico installazione Alchemy SDK..."
if npm list | grep -q "alchemy-sdk"; then
  echo "✅ Alchemy SDK già installato"
else
  echo "⚠️ Alchemy SDK non trovato, installiamo..."
  npm install alchemy-sdk
fi

echo "🚀 Configurazione pre-deploy completata!"
exit 0