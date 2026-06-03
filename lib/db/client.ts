import { D1Database } from '@cloudflare/workers-types';
import { DatabaseService, IDatabaseService } from './database';

// Global database instance - will be initialized by Cloudflare Workers
let dbService: IDatabaseService | null = null;

/**
 * Initialize database with D1 binding from Cloudflare environment
 * Call this from your Worker entry point or API route
 */
export function initializeDatabase(env: { DB: D1Database }): void {
  if (!dbService) {
    dbService = new DatabaseService(env.DB);
  }
}

/**
 * Get the initialized database service
 * Must call initializeDatabase first
 */
export function getDatabase(): IDatabaseService {
  if (!dbService) {
    throw new Error(
      'Database not initialized. Call initializeDatabase(env) first with Cloudflare D1 binding.'
    );
  }
  return dbService;
}

/**
 * Alias for getDatabase - used throughout the app
 * This connects to the real Cloudflare D1 database
 */
export function getLocalDatabase(): IDatabaseService {
  return getDatabase();
}
