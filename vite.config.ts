// vite.config.ts (nella root del progetto)
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";             // o React/TSX ecc.
import express from "express";
import path from "path";

// IMPORTA il tuo server/registro delle rotte
// supponendo che in server/root.js tu faccia:
//    export function registerRoutes(app) { … }
//    export default app;
import { registerRoutes } from "./server/routes.js";

export default defineConfig({
  plugins: [vue()],
  server: {
    middlewareMode: true,
    setup: ({ middlewares }) => {
      // 1) crea un'istanza Express “pulita”
      const api = express();
      api.use(express.json());
      api.use(express.urlencoded({ extended: true }));

      // 2) registra tutte le tue /api/... qui dentro
      registerRoutes(api);

      // (opzionale) log rapida delle rotte montate
      console.log(
        "🚀 API Routes:",
        api._router.stack
          .filter((r: any) => r.route)
          .map((r: any) => Object.keys(r.route.methods)[0].toUpperCase() + " " + r.route.path)
      );

      // 3) monta *prime* le /api sul dev-server di Vite
      middlewares.use(api);

      // 4) lascia che Vite gestisca tutto il resto (JS/CSS/HTML)
    }
  },
  resolve: {
    alias: {
      // se ti serve importare moduli dal server in front
      "@server": path.resolve(__dirname, "server")
    }
  }
});