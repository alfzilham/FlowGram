import { pool } from '../_db.js';
import { normalizeVersion, normalizeVersionWithData } from '../models/version.model.js';

const MAX_VERSIONS_PER_PROJECT = 50;

export async function findVersionsByProject(projectId, userId) {
    const { rows } = await pool.query(
        `SELECT id, project_id, version_number, node_count, label, created_at
         FROM workflow_versions
         WHERE project_id = $1 AND user_id = $2
         ORDER BY version_number DESC
         LIMIT $3`,
        [projectId, userId, MAX_VERSIONS_PER_PROJECT]
    );
    return rows.map(normalizeVersion);
}

export async function findVersionById(projectId, versionId, userId) {
    const { rows } = await pool.query(
        'SELECT * FROM workflow_versions WHERE id = $1 AND project_id = $2 AND user_id = $3',
        [versionId, projectId, userId]
    );
    return rows.length > 0 ? normalizeVersionWithData(rows[0]) : null;
}

export async function getNextVersionNumber(projectId, userId) {
    const { rows } = await pool.query(
        'SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM workflow_versions WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
    );
    return rows[0].next;
}

export async function createVersion(id, projectId, userId, versionNumber, data, label) {
    const nodeCount = data?.nodes?.length || 0;
    await pool.query(
        `INSERT INTO workflow_versions (id, project_id, user_id, version_number, data, node_count, label)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, projectId, userId, versionNumber, JSON.stringify(data), nodeCount, label || null]
    );
    return { id, project_id: projectId, version_number: versionNumber, node_count: nodeCount, label: label || null };
}

export async function deleteVersion(projectId, versionId, userId) {
    await pool.query(
        'DELETE FROM workflow_versions WHERE id = $1 AND project_id = $2 AND user_id = $3',
        [versionId, projectId, userId]
    );
}

export async function pruneOldVersions(projectId, userId, keepCount) {
    await pool.query(
        `DELETE FROM workflow_versions
         WHERE project_id = $1 AND user_id = $2
         AND id NOT IN (
             SELECT id FROM workflow_versions
             WHERE project_id = $1 AND user_id = $2
             ORDER BY version_number DESC
             LIMIT $3
         )`,
        [projectId, userId, keepCount]
    );
}

export async function countVersions(projectId, userId) {
    const { rows } = await pool.query(
        'SELECT COUNT(*)::int AS cnt FROM workflow_versions WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
    );
    return rows[0].cnt;
}
