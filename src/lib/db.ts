import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5433/dimovtax";

const globalForPg = globalThis as unknown as {
  pgPool?: Pool;
};

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}
