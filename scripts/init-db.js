import { readFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { pool } from '../api/_db.js';

// Run base schema
const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
await pool.query(schema);
console.log('Base schema initialized.');

// Run migrations in order
const migrationsDir = new URL('../db/migrations/', import.meta.url);
try {
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    for (const file of sqlFiles) {
        const sql = await readFile(new URL('../db/migrations/' + file, import.meta.url), 'utf8');
        await pool.query(sql);
        console.log('Migration applied: ' + file);
    }
} catch (e) {
    // migrations directory may not exist yet
    if (e.code !== 'ENOENT') throw e;
}

console.log('FlowGram database initialized.');
await pool.end();
