# IASE Project - Dockerfile per Render
# Usa questo Dockerfile se preferisci un approccio containerizzato su Render

FROM node:20-slim

WORKDIR /app

# Installa le dipendenze
COPY package*.json ./
RUN npm install


# Copia il codice sorgente
COPY . .


# Imposta variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=3000
ENV DEBUG=true
ENV LOG_LEVEL=verbose
ENV PUBLIC_PATH=/app/public
ENV STATIC_PATH=/app/public
ENV CONFIG_PATH=/app/config
ENV ALTERNATIVE_PUBLIC_PATH=/app/public

# Database (commentare se usi le variabili di Render)
# ENV PGHOST=dpg-d0ff45buibrs73ekrt6g-a
# ENV PGUSER=iaseproject
# ENV PGDATABASE=iaseproject
# ENV PGPASSWORD=GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1
# ENV PGPORT=5432
# ENV DATABASE_URL=postgresql://iaseproject:GRxrehk6Isv8s3dS3KDJFQ3HMVlxc8k1@dpg-d0ff45buibrs73ekrt6g-a.oregon-postgres.render.com/iaseproject

# Esponi la porta
EXPOSE 3000

# Esegui l'applicazione 
CMD ["node", "server-fix.js"]