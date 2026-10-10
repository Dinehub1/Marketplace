import { neon } from '@neondatabase/serverless';

/**
 * Neon database connection.
 * Credentials must be supplied via environment variables (DATABASE_URL or EXPO_PUBLIC_DATABASE_URL)
 * and never hardcoded in source control.
 */
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.EXPO_PUBLIC_DATABASE_URL ||
  '';

export const sql = neon(DATABASE_URL);

export const dbConfig = {
  projectId: process.env.NEON_PROJECT_ID || 'curly-dream-77249049',
  databaseName: process.env.NEON_DATABASE_NAME || 'neondb',
  connectionString: DATABASE_URL,
};

