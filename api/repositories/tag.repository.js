import { pool } from '../_db.js';

export async function addTag(projectId, userId, tag) {
    const result = await pool.query(
        `INSERT INTO project_tags (project_id, user_id, tag)
         SELECT p.id, $2, $3 FROM projects p
         WHERE p.id = $1 AND p.user_id = $2 AND p.deleted_at IS NULL
         ON CONFLICT DO NOTHING`,
        [projectId, userId, tag]
    );
    return result.rowCount > 0;
}

export async function removeTag(projectId, userId, tag) {
    await pool.query(
        'DELETE FROM project_tags WHERE project_id = $1 AND user_id = $2 AND tag = $3',
        [projectId, userId, tag]
    );
}

export async function getTagsByProject(projectId, userId) {
    const project = await pool.query('SELECT 1 FROM projects WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [projectId, userId]);
    if (!project.rowCount) return null;
    const { rows } = await pool.query(
        'SELECT tag FROM project_tags WHERE project_id = $1 AND user_id = $2 ORDER BY tag',
        [projectId, userId]
    );
    return rows.map(r => r.tag);
}

export async function getAllUserTags(userId) {
    const { rows } = await pool.query(
        'SELECT DISTINCT tag FROM project_tags WHERE user_id = $1 ORDER BY tag',
        [userId]
    );
    return rows.map(r => r.tag);
}

export async function searchProjects(userId, { query, folderId, tag, from, to, archived }) {
    let sql = `SELECT p.id, p.name, p.folder_id, p.archived, p.color, p.node_count, p.created_at, p.updated_at
               FROM projects p`;
    const conditions = ['p.user_id = $1', 'p.deleted_at IS NULL'];
    const vals = [userId];
    let idx = 2;

    if (tag) {
        sql += ` INNER JOIN project_tags pt ON pt.project_id = p.id AND pt.user_id = $1 AND pt.tag = $${idx++}`;
        vals.push(tag);
    }

    if (query) {
        conditions.push(`(p.name ILIKE $${idx} OR p.data::text ILIKE $${idx})`);
        vals.push('%' + query + '%');
        idx++;
    }

    if (folderId) {
        conditions.push(`p.folder_id = $${idx++}`);
        vals.push(folderId);
    }

    if (from) {
        conditions.push(`p.created_at >= $${idx++}`);
        vals.push(from);
    }

    if (to) {
        conditions.push(`p.created_at <= $${idx++}`);
        vals.push(to);
    }

    if (archived !== undefined) {
        conditions.push(`p.archived = $${idx++}`);
        vals.push(archived);
    } else {
        conditions.push('p.archived = FALSE');
    }

    sql += ` WHERE ${conditions.join(' AND ')} ORDER BY p.updated_at DESC`;

    const { rows } = await pool.query(sql, vals);
    return rows;
}
