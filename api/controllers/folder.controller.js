import * as folderService from '../services/folder.service.js';

export async function handleListFolders(c, payload) {
    const folders = await folderService.listFolders(payload.userId);
    return c.json({ folders });
}

export async function handleCreateFolder(c, payload) {
    try {
        const body = await c.req.json();
        const folder = await folderService.createFolder(payload.userId, body.name);
        return c.json({ folder });
    } catch (e) {
        return c.json({ error: e.message || 'Gagal membuat folder' }, 500);
    }
}

export async function handleRenameFolder(c, payload) {
    try {
        const body = await c.req.json();
        if (!body.name || !body.name.trim()) return c.json({ error: 'Nama tidak boleh kosong' }, 400);
        await folderService.renameFolder(c.req.param('id'), payload.userId, body.name.trim());
        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: e.message || 'Gagal update folder' }, 500);
    }
}

export async function handleDeleteFolder(c, payload) {
    await folderService.deleteFolder(c.req.param('id'), payload.userId);
    return c.json({ success: true });
}
