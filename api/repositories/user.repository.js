import { pool } from '../_db.js';
import { normalizeUser } from '../models/user.model.js';

export async function findUserByGoogleId(googleId) {
    const { rows } = await pool.query(
        'SELECT id, email, name, avatar_url FROM users WHERE google_id = $1',
        [googleId]
    );
    return rows.length > 0 ? rows[0] : null;
}

export async function findUserById(id) {
    const { rows } = await pool.query(
        'SELECT id, email, name, avatar_url FROM users WHERE id = $1',
        [id]
    );
    return rows.length > 0 ? normalizeUser(rows[0]) : null;
}

export async function createUser(id, email, name, avatarUrl, googleId) {
    await pool.query(
        'INSERT INTO users (id, email, name, avatar_url, google_id) VALUES ($1,$2,$3,$4,$5)',
        [id, email, name, avatarUrl, googleId]
    );
}

export async function updateUserName(userId, name) {
    await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
}

export async function deleteUser(userId) {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}
