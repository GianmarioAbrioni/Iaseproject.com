import { Router } from 'express';
import { createServer } from 'http';
import path from 'path';
import express from 'express';
import stakingRoutes from './routes.js'; // Assuming .js extension for ES modules

// Esporta la funzione registerRoutes usata in server/index.ts
export function registerRoutes(app) {
  // Registra le routes di staking sotto /api/staking
  app.use("/api/staking", stakingRoutes);


}

// Note: The original TypeScript code exports 'router' but it is not defined in the provided snippet.
// We are preserving the export statement exactly as requested, but 'router' will be undefined.
