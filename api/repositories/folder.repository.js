import { pool } from '../_db.js';
import { normalizeFolder } from '../models/folder.model.js';

export async function findFoldersByUserId(userId) {
    const { rows } = await pool.query(
        'SELECT id, name, archived FROM folders WHERE user_id = $1 ORDER BY name',
        [userId]
    );
    return rows.map(normalizeFolder);
}

export async function findFolderByIdAndUser(id, userId) {
    const { rows } = await pool.query(
        'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
        [id, userId]
    );
    return rows.length > 0;
}

export async function createFolder(id, userId, name) {
    await pool.query(
        'INSERT INTO folders (id, user_id, name, archived) VALUES ($1,$2,$3,$4)',
        [id, userId, name, false]
    );
    return { id, name, archived: false };
}

export async function updateFolderName(id, userId, name) {
    await pool.query(
        'UPDATE folders SET name = $1 WHERE id = $2 AND user_id = $3',
        [name, id, userId]
    );
}

export async function deleteFolderAndUnlinkProjects(id, userId) {
    await pool.query('UPDATE projects SET folder_id = null WHERE folder_id = $1 AND user_id = $2', [id, userId]);
    await pool.query('DELETE FROM folders WHERE id = $1 AND user_id = $2', [id, userId]);
}

export async function deleteFoldersByUserId(userId) {
    await pool.query('DELETE FROM folders WHERE user_id = $1', [userId]);
}
