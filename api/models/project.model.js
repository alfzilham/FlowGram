export function normalizeProject(row) {
    return {
        id: row.id,
        name: row.name,
        folder_id: row.folder_id,
        archived: row.archived,
        color: row.color,
        node_count: row.node_count,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
}

export function normalizeProjectWithData(row) {
    const p = normalizeProject(row);
    p.data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    return p;
}
