/**
 * IASE Project - PostgreSQL Configuration
 *
 * Standard configuration for PostgreSQL database connection on Render.
 * Uses standard pg driver (not Neon) for maximum compatibility.
 */
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// SSL configuration for Render
const isProduction = process.env.NODE_ENV === 'production';
const sslConfig = isProduction ? { rejectUnauthorized: false } : false;

// PostgreSQL connection configuration
const pgConfig = {
  // Use DATABASE_URL from environment variable
  connectionString: process.env.DATABASE_URL,
  // Connection settings
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // maximum idle time
  connectionTimeoutMillis: 10000, // connection timeout
  ssl: sslConfig
};

// Check for DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not set - database connections will fail");
  throw new Error("DATABASE_URL is required for the application to function");
}

// Initialize PostgreSQL connection pool
console.log("📊 Initializing PostgreSQL database connection");
export const pool = new pg.Pool(pgConfig);

// Test database connection
pool.query('SELECT NOW()')
  .then(res => {
    console.log(`✅ PostgreSQL database connection established: ${res.rows[0].now}`);
  })
  .catch(err => {
    console.error(`❌ Database connection error: ${err.message}`);
    
    // Log connection details for debugging (without exposing the password)
    const configForLog = { ...pgConfig };
    if (configForLog.connectionString) {
      configForLog.connectionString = configForLog.connectionString.replace(/:[^:@]*@/, ':***@');
    }
    console.log('ℹ️ Connection configuration:', configForLog);
  });

// Configure Drizzle ORM
export const db = drizzle(pool, { schema });
