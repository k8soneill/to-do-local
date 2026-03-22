import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from '../schema';

export function createTestDb() {
	const client = new Database(':memory:');
	client.exec('PRAGMA journal_mode=WAL;');
	client.exec('PRAGMA foreign_keys=ON;');
	const db = drizzle(client, { schema });
	migrate(db, { migrationsFolder: 'drizzle' });
	return { db, client };
}
