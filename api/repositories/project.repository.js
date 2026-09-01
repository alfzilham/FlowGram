import { pool } from '../_db.js';
import { normalizeProject, normalizeProjectWithData } from '../models/project.model.js';

export async function findProjectsByUserId(userId) {
    const { rows } = await pool.query(
        `SELECT id, name, folder_id, archived, color, node_count, created_at, updated_at
         FROM projects WHERE user_id = $1 AND deleted_at IS NULL ORDER BY updated_at DESC`,
        [userId]
    );
    return rows.map(normalizeProject);
}

export async function findProjectByIdAndUser(id, userId) {
    const { rows } = await pool.query(
        'SELECT * FROM projects WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [id, userId]
    );
    return rows.length > 0 ? normalizeProjectWithData(rows[0]) : null;
}

export async function createProject(id, userId, name, folderId, color, data) {
    const now = new Date().toISOString();
    const nodeCount = data?.nodes?.length || 0;
    await pool.query(
        `INSERT INTO projects (id, user_id, name, folder_id, archived, color, node_count, data, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, userId, name, folderId, false, color, nodeCount, JSON.stringify(data || {}), now, now]
    );
    return { id, name, folder_id: folderId, archived: false, color, node_count: nodeCount, created_at: now, updated_at: now };
}

export async function updateProject(id, userId, fields) {
    const updates = [];
    const vals = [];
    let idx = 1;

    if (fields.name !== undefined) { updates.push('name = $' + idx++); vals.push(fields.name); }
    if (fields.folderId !== undefined) { updates.push('folder_id = $' + idx++); vals.push(fields.folderId); }
    if (fields.archived !== undefined) { updates.push('archived = $' + idx++); vals.push(fields.archived); }
    if (fields.color !== undefined) { updates.push('color = $' + idx++); vals.push(fields.color); }
    if (fields.data !== undefined) {
        const nodeCount = fields.data.nodes?.length || 0;
        updates.push('data = $' + idx++);
        vals.push(JSON.stringify(fields.data));
        updates.push('node_count = $' + idx++);
        vals.push(nodeCount);
    }
    updates.push('updated_at = NOW()');

    vals.push(id, userId);
    await pool.query(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = $${idx++} AND user_id = $${idx}`,
        vals
    );
}

export async function updateProjectData(id, userId, data) {
    const nodeCount = data?.nodes?.length || 0;
    await pool.query(
        `UPDATE projects SET data = $1, node_count = $2, updated_at = NOW()
         WHERE id = $3 AND user_id = $4`,
        [JSON.stringify(data), nodeCount, id, userId]
    );
}

export async function deleteProject(id, userId) {
    await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [id, userId]);
}

export async function deleteProjectsByUserId(userId) {
    await pool.query('DELETE FROM projects WHERE user_id = $1', [userId]);
}

export async function softDeleteProject(id, userId) {
    await pool.query(
        'UPDATE projects SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [id, userId]
    );
}

export async function restoreProject(id, userId) {
    await pool.query(
        'UPDATE projects SET deleted_at = NULL WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL',
        [id, userId]
    );
}

export async function findTrashedProjects(userId) {
    const { rows } = await pool.query(
        `SELECT id, name, folder_id, archived, color, node_count, created_at, updated_at, deleted_at
         FROM projects WHERE user_id = $1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
        [userId]
    );
    return rows.map(normalizeProject);
}

export async function duplicateProject(srcId, userId, newName, newFolderId) {
    const src = await findProjectByIdAndUser(srcId, userId);
    if (!src) return null;

    const newId = uid('p');
    const now = new Date().toISOString();
    const data = src.data || {};
    const nodeCount = data?.nodes?.length || 0;

    await pool.query(
        `INSERT INTO projects (id, user_id, name, folder_id, archived, color, node_count, data, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [newId, userId, newName || src.name + ' (Copy)', newFolderId || src.folder_id, false, src.color, nodeCount, JSON.stringify(data), now, now]
    );
    return { id: newId, name: newName || src.name + ' (Copy)', folder_id: newFolderId || src.folder_id, archived: false, color: src.color, node_count: nodeCount, created_at: now, updated_at: now };
}
