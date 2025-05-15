import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import { USE_MEMORY_DB } from "./config";
import { verifyAllStakes } from "./services/nft-verification";

// Check if we're in NFT verification mode
const isVerificationMode = process.argv.includes('--mode=verification');

// Main function to start web server
async function startWebServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Log database mode
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔄 Database mode: ${USE_MEMORY_DB ? 'IN-MEMORY' : 'POSTGRESQL'}`);
  
  // Setup authentication
  setupAuth(app);
  
  // Add an advanced health check endpoint for Render and monitoring
  app.get('/health', async (req, res) => {
    let dbStatus = 'unknown';
    
    // In production, we also check the database status
    if (!USE_MEMORY_DB && process.env.NODE_ENV === 'production') {
      try {
        // Verify database connection
        const { storage } = await import('./storage');
        const dbConnection = await storage.testConnection();
        dbStatus = dbConnection ? 'connected' : 'disconnected';
      } catch (error) {
        dbStatus = 'error';
        console.error('Health check DB error:', error);
      }
    } else {
      dbStatus = 'memory-mode';
    }
    
    res.status(200).json({
      status: 'ok',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  });
  
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;
  
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
  
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
  
        log(logLine);
      }
    });
  
    next();
  });
  
  const server = await registerRoutes(app);
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
  
    res.status(status).json({ message });
    throw err;
  });
  
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Use PORT from environment variables (for Render compatibility) or default to 5000
  // this serves both the API and the client.
  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  return server;
}

// Function to run the NFT verification job
async function runVerificationJob() {
  console.log("🔄 IASE Project - Starting NFT verification job");
  
  try {
    console.log("✅ Starting verification of NFT stakes...");
    await verifyAllStakes();
    
    console.log("✅ Verification completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during verification:", error);
    process.exit(1);
  }
}

// Start the application based on the mode
(async () => {
  if (isVerificationMode) {
    console.log("🚀 Starting in NFT verification mode");
    await runVerificationJob();
  } else {
    console.log("🚀 Starting standard web server");
    await startWebServer();
  }
})();
