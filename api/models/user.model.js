export function normalizeUser(row) {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        avatarUrl: row.avatar_url
    };
}
