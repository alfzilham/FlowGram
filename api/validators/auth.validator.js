export function validateGoogleToken(body) {
    if (!body || typeof body.googleToken !== 'string' || !body.googleToken) return 'Missing googleToken';
    return null;
}

export function validateName(body) {
    if (!body || typeof body.name !== 'string' || !body.name.trim()) return 'Nama tidak boleh kosong';
    if (body.name.trim().length > 255) return 'Nama terlalu panjang';
    return null;
}
