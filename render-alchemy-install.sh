#!/bin/bash

# Script per installare correttamente Alchemy SDK e ethers.js durante il deploy su Render
# Versione 2.0.0 - 2025-05-15

echo "🔧 IASE - Installazione avanzata Web3 per Render"
echo "=================================================="

# Verifica che npm sia disponibile
if ! command -v npm &> /dev/null; then
    echo "❌ ERRORE: npm non è disponibile"
    exit 1
fi

# Verifica la cartella corrente
echo "📂 Directory corrente: $(pwd)"
echo "📁 Contenuto directory principali:"
ls -la
ls -la public/ 2>/dev/null || echo "Directory public/ non trovata"

# Installa ethers.js globalmente per assicurarsi che sia disponibile ovunque
echo "🔄 Installazione ethers.js (versione 5.7.2 per massima compatibilità)..."
npm install --save ethers@5.7.2

# Installa Alchemy SDK
echo "🔄 Installazione Alchemy SDK..."
npm install --save alchemy-sdk

# Installa browserify se necessario
echo "🔄 Verifica browserify per bundle..."
if ! command -v npx browserify &> /dev/null; then
    echo "⚠️ browserify non trovato, lo installo..."
    npm install --save-dev browserify
fi

# Crea directory js se non esistono
mkdir -p public/js
mkdir -p client/public/js 2>/dev/null || true
echo "📁 Directory js create/verificate"

# Crea un bundle ethers.js per il caricamento diretto nel browser
echo "🔄 Creazione bundle ethers.js per il browser..."
npx browserify -r ethers -o public/js/ethers-bundle.js
cp public/js/ethers-bundle.js client/public/js/ethers-bundle.js 2>/dev/null || true

# Crea un mini-bundle per inizializzare Alchemy in modo asincrono
echo "🔄 Creazione helper di inizializzazione Alchemy..."
cat > public/js/alchemy-init.js << EOL
/**
 * Initializzatore Alchemy per IASE Project
 * Carica Alchemy in modo asincrono
 * Generato automaticamente durante il deploy: $(date)
 */

// Configurazione globale
window.ALCHEMY_API_KEY = window.ALCHEMY_API_KEY || "uAZ1tPYna9tBMfuTa616YwMcgptV_1vB";
window.ALCHEMY_NETWORK = "eth-mainnet";
window.USE_ALCHEMY_API = true;

// Funzione di inizializzazione Alchemy che sarà chiamata quando il DOM è pronto
window.initializeAlchemy = function() {
  console.log("🔄 Inizializzazione Alchemy...");
  if (typeof window.Alchemy !== 'undefined') {
    console.log("✅ Alchemy già inizializzato");
    return Promise.resolve(window.Alchemy);
  }
  
  return new Promise((resolve, reject) => {
    // Config dinamica
    const config = {
      apiKey: window.ALCHEMY_API_KEY, 
      network: window.ALCHEMY_NETWORK
    };
    
    // Se Alchemy SDK è caricato attraverso il tag script
    if (typeof AlchemyWeb3 !== 'undefined') {
      window.Alchemy = new AlchemyWeb3.createAlchemyWeb3(
        \`https://eth-mainnet.g.alchemy.com/v2/\${window.ALCHEMY_API_KEY}\`
      );
      console.log("✅ Alchemy inizializzato (via AlchemyWeb3)");
      resolve(window.Alchemy);
      return;
    }
    
    // Carica Alchemy SDK dinamicamente se necessario
    if (typeof alchemy === 'undefined') {
      const script = document.createElement('script');
      script.src = "https://cdn.alchemy.com/alchemy-web3.min.js";
      script.async = true;
      script.onload = () => {
        window.Alchemy = new AlchemyWeb3.createAlchemyWeb3(
          \`https://eth-mainnet.g.alchemy.com/v2/\${window.ALCHEMY_API_KEY}\`
        );
        console.log("✅ Alchemy caricato e inizializzato (via CDN)");
        resolve(window.Alchemy);
      };
      script.onerror = () => {
        console.error("❌ Errore nel caricamento di Alchemy SDK");
        reject(new Error("Impossibile caricare Alchemy SDK"));
      };
      document.head.appendChild(script);
    } else {
      // Alchemy SDK già disponibile
      window.Alchemy = alchemy;
      console.log("✅ Alchemy SDK già disponibile");
      resolve(window.Alchemy);
    }
  });
};

// Auto-inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
  window.initializeAlchemy()
    .then(alchemy => {
      console.log("Alchemy pronto per l'uso");
      // Dispatch evento che può essere ascoltato da altre parti dell'app
      document.dispatchEvent(new CustomEvent('alchemy:ready'));
    })
    .catch(error => {
      console.error("Errore inizializzazione Alchemy:", error);
    });
});

console.log("✅ Helper Alchemy caricato");
EOL

cp public/js/alchemy-init.js client/public/js/alchemy-init.js 2>/dev/null || true

# Verifica se i file sono stati creati correttamente
if [ -f "public/js/alchemy-init.js" ]; then
  echo "✅ File di inizializzazione Alchemy creato con successo"
else
  echo "❌ ERRORE: Impossibile creare file di inizializzazione Alchemy"
fi

if [ -f "public/js/ethers-bundle.js" ]; then
  echo "✅ Bundle ethers.js creato con successo"
else
  echo "❌ ERRORE: Impossibile creare bundle ethers.js"
fi

# Ora aggiungiamo gli script necessari agli HTML se mancano
echo "🔄 Verifico e aggiorno i file HTML se necessario..."

add_scripts_to_html() {
  local file=$1
  if [ -f "$file" ]; then
    echo "Verifico $file per aggiungere script mancanti..."
    
    # Crea una copia di backup
    cp "$file" "${file}.bak"
    
    # Verifica se manca ethers-bundle.js
    if ! grep -q "ethers-bundle.js" "$file"; then
      echo "⚠️ Aggiungo ethers-bundle.js a $file"
      
      # Aggiungi prima del tag di chiusura </head>
      sed -i 's|</head>|  <script src="js/ethers-bundle.js"></script>\n</head>|' "$file"
    fi
    
    # Verifica se manca alchemy-init.js
    if ! grep -q "alchemy-init.js" "$file"; then
      echo "⚠️ Aggiungo alchemy-init.js a $file"
      
      # Aggiungi prima del tag di chiusura </head>
      sed -i 's|</head>|  <script src="js/alchemy-init.js"></script>\n</head>|' "$file"
    fi
    
    echo "✅ Aggiornamento di $file completato"
  else
    echo "⚠️ File $file non trovato, nessuna modifica necessaria"
  fi
}

# Aggiorna i file HTML principali
add_scripts_to_html "public/staking.html"
add_scripts_to_html "public/index.html"

# Verifica anche in client/public se esiste
add_scripts_to_html "client/public/staking.html"
add_scripts_to_html "client/public/index.html"

echo "✅ Installazione Web3 avanzata completata"
echo "=================================================="