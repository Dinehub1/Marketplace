import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_7aubdKhH4qVc@ep-dawn-tooth-ad9ft25c-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

export const sql = neon(DATABASE_URL);

export const dbConfig = {
  projectId: 'curly-dream-77249049',
  databaseName: 'neondb',
  connectionString: DATABASE_URL,
};
