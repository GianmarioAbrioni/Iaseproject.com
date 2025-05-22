import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import express from 'express'
import { registerRoutes } from './routes'    // il tuo routes.js / routes.ts

export default defineConfig({
  plugins: [
    vue(),

    // plugin custom per montare Express
    {
      name: 'mount-express-api',
      // questo gira **solo** in dev
      configureServer(server) {
        // 1) crea una nuova istanza di Express
        const api = express()

        // 2) monta body-parser (o usa express.json())
        api.use(express.json())
        api.use(express.urlencoded({ extended: true }))

        // 3) registra qui TUTTE le tue API
        registerRoutes(api)

        // 4) monta Express sui path /api/*
        //    * PRIMA * che Vite serva il fallback a index.html
        server.middlewares.use(api)
      }
    }
  ],

  server: {
    // attiva il middleware mode, così non c’è un server statico a parte
    middlewareMode: 'ssr'
  }
})