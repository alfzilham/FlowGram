export function normalizeFolder(row) {
    return {
        id: row.id,
        name: row.name,
        archived: row.archived
    };
}
