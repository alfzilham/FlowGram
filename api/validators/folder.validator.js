export function validateFolderName(body) {
    if (!body || typeof body.name !== 'string' || !body.name.trim()) return 'Nama folder tidak boleh kosong';
    if (body.name.trim().length > 255) return 'Nama folder terlalu panjang';
    return null;
}
