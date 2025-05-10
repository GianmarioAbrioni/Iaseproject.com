/**
 * IASE Project - Server entry point (No Database version)
 * 
 * Versione del server che utilizza storage in memoria invece di PostgreSQL
 * per massima compatibilità con Render.
 */

// FIX IMPORTANTE: Imposta esplicitamente 'localhost' come host di database
// come richiesto dall'errore in Render "please set the host to 'localhost' explicitly"
process.env.PGHOST = 'localhost';
process.env.PGUSER = process.env.PGUSER || 'localuser';
process.env.PGDATABASE = process.env.PGDATABASE || 'localdb';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'localpass';

// Per sicurezza imposta anche DATABASE_URL
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:5432/${process.env.PGDATABASE}`;
}

import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log, serveStatic } from "./vite";
import { setupAuth } from "./auth";
import { USE_MEMORY_DB } from "./config";

function createApp() {
  const app = express();

  // Configurazione base di Express
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Setup autenticazione
  setupAuth(app);

  // Log richieste API
  app.use("/api", (req, _res, next) => {
    log(`${req.method} ${req.path}${
      Object.keys(req.query).length > 0 ? ` ${JSON.stringify(req.query)}` : ""
    }`);
    next();
  });

  // Gestione errori globale
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Server error:", err);
    res.status(500).json({
      error: "Si è verificato un errore interno",
      message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  });

  return app;
}

async function main() {
  const app = createApp();

  // Registra le rotte API e ottieni il server HTTP
  const httpServer = await registerRoutes(app);

  // Configurazione di Vite in modalità development
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, httpServer);
  } else {
    // Serve static files in production
    serveStatic(app);
  }
  
  // Start server
  const port = process.env.PORT || 5000;
  httpServer.listen({
    port: Number(port),
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
}

main().catch(console.error);