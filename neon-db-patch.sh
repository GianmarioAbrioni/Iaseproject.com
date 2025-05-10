#!/bin/bash

# Script per patchare il modulo @neondatabase/serverless e prevenire errori
# quando non viene specificato un DATABASE_URL valido

echo "🔧 Patchare il modulo neon database"

# Verifica se il modulo è presente
if [ -d "node_modules/@neondatabase/serverless" ]; then
  echo "✅ Trovato modulo @neondatabase/serverless"
  
  # Crea una copia di backup del file originale
  cp node_modules/@neondatabase/serverless/index.mjs node_modules/@neondatabase/serverless/index.mjs.orig

  # Inserisci fix in cima al file
  sed -i '1i\
// Questo è un fix automatico\
process.env.PGHOST = process.env.PGHOST || "localhost";\
process.env.PGUSER = process.env.PGUSER || "localuser";\
process.env.PGDATABASE = process.env.PGDATABASE || "localdb";\
process.env.PGPASSWORD = process.env.PGPASSWORD || "localpass";\
' node_modules/@neondatabase/serverless/index.mjs

  echo "✅ Fix applicato"
else
  echo "❌ Modulo @neondatabase/serverless non trovato"
fi

echo "🏁 Patch completata"