import { pool } from '../_db.js';
import { normalizeFolder } from '../models/folder.model.js';

export async function findFoldersByUserId(userId) {
    const { rows } = await pool.query(
        'SELECT id, name, archived FROM folders WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name',
        [userId]
    );
    return rows.map(normalizeFolder);
}

export async function findFolderByIdAndUser(id, userId) {
    const { rows } = await pool.query(
        'SELECT id FROM folders WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
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

export async function softDeleteFolder(id, userId) {
    await pool.query(
        'UPDATE folders SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [id, userId]
    );
    // Also soft delete projects in this folder
    await pool.query(
        'UPDATE projects SET deleted_at = NOW() WHERE folder_id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [id, userId]
    );
}

export async function restoreFolder(id, userId) {
    await pool.query(
        'UPDATE folders SET deleted_at = NULL WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL',
        [id, userId]
    );
    // Also restore projects in this folder
    await pool.query(
        'UPDATE projects SET deleted_at = NULL WHERE folder_id = $1 AND user_id = $2 AND deleted_at IS NOT NULL',
        [id, userId]
    );
}

export async function findTrashedFolders(userId) {
    const { rows } = await pool.query(
        'SELECT id, name, archived FROM folders WHERE user_id = $1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC',
        [userId]
    );
    return rows.map(normalizeFolder);
}

export async function unlinkProjectsFromFolder(id, userId) {
    await pool.query(
        'UPDATE projects SET folder_id = NULL WHERE folder_id = $1 AND user_id = $2',
        [id, userId]
    );
}
