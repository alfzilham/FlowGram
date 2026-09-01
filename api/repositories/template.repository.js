import { pool } from '../_db.js';
import { normalizeTemplate, normalizeTemplateWithData } from '../models/template.model.js';

export async function findAllTemplates(userId) {
    const { rows } = await pool.query(
        `SELECT * FROM templates
         WHERE user_id = $1 OR is_builtin = TRUE
         ORDER BY is_builtin DESC, name ASC`,
        [userId]
    );
    return rows.map(normalizeTemplate);
}

export async function findTemplateById(id, userId) {
    const { rows } = await pool.query(
        'SELECT * FROM templates WHERE id = $1 AND (user_id = $2 OR is_builtin = TRUE)',
        [id, userId]
    );
    return rows.length > 0 ? normalizeTemplateWithData(rows[0]) : null;
}

export async function createTemplate(id, userId, name, description, category, data) {
    const now = new Date().toISOString();
    await pool.query(
        `INSERT INTO templates (id, user_id, name, description, category, data, is_builtin, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, $8)`,
        [id, userId, name, description || '', category || 'general', JSON.stringify(data || {}), now, now]
    );
    return { id, user_id: userId, name, description: description || '', category: category || 'general', is_builtin: false, created_at: now, updated_at: now };
}

export async function updateTemplate(id, userId, fields) {
    const updates = [];
    const vals = [];
    let idx = 1;

    if (fields.name !== undefined) { updates.push('name = $' + idx++); vals.push(fields.name); }
    if (fields.description !== undefined) { updates.push('description = $' + idx++); vals.push(fields.description); }
    if (fields.category !== undefined) { updates.push('category = $' + idx++); vals.push(fields.category); }
    if (fields.data !== undefined) { updates.push('data = $' + idx++); vals.push(JSON.stringify(fields.data)); }
    updates.push('updated_at = NOW()');

    if (updates.length === 1) return; // only updated_at

    vals.push(id, userId);
    await pool.query(
        `UPDATE templates SET ${updates.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} AND is_builtin = FALSE`,
        vals
    );
}

export async function deleteTemplate(id, userId) {
    await pool.query(
        'DELETE FROM templates WHERE id = $1 AND user_id = $2 AND is_builtin = FALSE',
        [id, userId]
    );
}

export async function insertBuiltinTemplates(templates) {
    for (const t of templates) {
        await pool.query(
            `INSERT INTO templates (id, user_id, name, description, category, data, is_builtin, created_at, updated_at)
             VALUES ($1, NULL, $2, $3, $4, $5, TRUE, NOW(), NOW())
             ON CONFLICT (id) DO NOTHING`,
            [t.id, t.name, t.description, t.category, JSON.stringify(t.data)]
        );
    }
}
