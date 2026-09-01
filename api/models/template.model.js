export function normalizeTemplate(row) {
    return {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        description: row.description,
        category: row.category,
        is_builtin: row.is_builtin,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
}

export function normalizeTemplateWithData(row) {
    const t = normalizeTemplate(row);
    t.data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    return t;
}
