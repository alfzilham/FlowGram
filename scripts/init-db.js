import { readFile } from 'node:fs/promises';
import { pool } from '../api/_db.js';

const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');

try {
    await pool.query(schema);
    console.log('FlowGram database schema initialized.');
} finally {
    await pool.end();
}
