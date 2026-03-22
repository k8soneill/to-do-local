import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { Database } from 'bun:sqlite';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = new Database(url);
client.exec('PRAGMA journal_mode=WAL;');

const db = drizzle(client);
migrate(db, { migrationsFolder: 'drizzle' });

console.log('Migrations applied successfully.');
client.close();
