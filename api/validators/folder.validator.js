export function validateFolderName(body) {
    if (!body.name || !body.name.trim()) return 'Nama folder tidak boleh kosong';
    return null;
}
