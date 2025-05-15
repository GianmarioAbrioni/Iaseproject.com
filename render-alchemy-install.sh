#!/bin/bash

# Script di installazione e configurazione Alchemy per Render
echo "🔧 IASE Project - Installazione Alchemy su Render"

# Verifica e crea le variabili d'ambiente
echo "📋 Configurazione variabili d'ambiente Alchemy..."

# Impostazione variabile temporanea (verranno sovrascritte dalle env di Render)
export ALCHEMY_API_KEY=${ALCHEMY_API_KEY:-"uAZ1tPYna9tBMfuTa616YwMcgptV_1vB"}
export ALCHEMY_API_URL=${ALCHEMY_API_URL:-"https://eth-mainnet.g.alchemy.com/v2/uAZ1tPYna9tBMfuTa616YwMcgptV_1vB"}
export ALCHEMY_ENHANCED_APIS=${ALCHEMY_ENHANCED_APIS:-"true"}
export ALCHEMY_NETWORK=${ALCHEMY_NETWORK:-"1"}

# Verifica stato variabili
echo "🔍 Verifica configurazione Alchemy:"
echo "ALCHEMY_API_KEY: ${ALCHEMY_API_KEY:0:5}...${ALCHEMY_API_KEY:(-5)}"
echo "ALCHEMY_API_URL: ${ALCHEMY_API_URL%%/v2*}/v2/API_KEY_HIDDEN"
echo "ALCHEMY_ENHANCED_APIS: $ALCHEMY_ENHANCED_APIS"
echo "ALCHEMY_NETWORK: $ALCHEMY_NETWORK"

# Installazione dipendenze
echo "📦 Verifica dipendenze necessarie..."
if npm list alchemy-sdk &>/dev/null; then
  echo "✅ alchemy-sdk già installato"
else
  echo "⚠️ Installazione alchemy-sdk..."
  npm install alchemy-sdk
fi

if npm list ethers &>/dev/null; then
  echo "✅ ethers.js già installato"
else
  echo "⚠️ Installazione ethers.js..."
  npm install ethers@^5.7.2
fi

# Test di connessione Alchemy
echo "🧪 Test connessione Alchemy API..."
TEST_RESULT=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" \
  "$ALCHEMY_API_URL")

if [[ "$TEST_RESULT" == *"result"* ]]; then
  echo "✅ Connessione Alchemy riuscita"
else
  echo "⚠️ Problema di connessione Alchemy, verifica la API key"
  echo "⚠️ Usando provider fallback"
fi

echo "🚀 Installazione Alchemy completata!"