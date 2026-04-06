import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDatabase = globalThis as typeof globalThis & {
   __circlePool?: Pool;
   __circleDb?: Database;
};

const pool = databaseUrl
   ? (globalForDatabase.__circlePool ?? new Pool({ connectionString: databaseUrl }))
   : null;

export const db = pool ? (globalForDatabase.__circleDb ?? drizzle({ client: pool, schema })) : null;

if (process.env.NODE_ENV !== 'production' && pool && db) {
   globalForDatabase.__circlePool = pool;
   globalForDatabase.__circleDb = db;
}

export { pool, schema };
