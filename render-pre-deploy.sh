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
EOL

echo "🚀 Configurazione pre-deploy completata!"
exit 0