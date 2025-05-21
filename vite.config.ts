import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import path from 'path';

// importa la funzione che registra le rotte
import { registerRoutes } from './routes.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'vite:express-api',
      // questo hook ci dà accesso all'istanza di Connect dietro Vite
      configureServer(server) {
        // crea una mini-app Express
        const apiApp = express();

        // monta body parser (stesse impostazioni di routes.js)
        apiApp.use(express.json());
        apiApp.use(express.urlencoded({ extended: true }));

        // registra tutte le tue rotte /api/... su questa app
        registerRoutes(apiApp);

        // ORDINE IMPORTANTE:
        // monta 'apiApp' **prima** del resto dei middleware di Vite
        // in modo che /api/* venga gestito da Express
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/api')) {
            return apiApp(req, res, next);
          }
          next();
        });
      }
    }
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets')
    }
  },

  root: path.resolve(__dirname, 'client'),
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true
  }
});
