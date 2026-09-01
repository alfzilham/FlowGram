export function normalizeVersion(row) {
    return {
        id: row.id,
        project_id: row.project_id,
        version_number: row.version_number,
        node_count: row.node_count,
        label: row.label,
        created_at: row.created_at
    };
}

export function normalizeVersionWithData(row) {
    const v = normalizeVersion(row);
    v.data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    return v;
}
