export function validateGoogleToken(body) {
    if (!body.googleToken) return 'Missing googleToken';
    return null;
}

export function validateName(body) {
    if (!body.name || !body.name.trim()) return 'Nama tidak boleh kosong';
    return null;
}
