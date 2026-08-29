import * as folderService from '../services/folder.service.js';
import { validateFolderName } from '../validators/folder.validator.js';

export async function handleListFolders(c, payload) {
    const folders = await folderService.listFolders(payload.userId);
    return c.json({ folders });
}

export async function handleCreateFolder(c, payload) {
    try {
        const body = await c.req.json();
        const nameErr = validateFolderName(body);
        if (nameErr) return c.json({ error: nameErr }, 400);
        const folder = await folderService.createFolder(payload.userId, body.name);
        return c.json({ folder });
    } catch (e) {
        return c.json({ error: 'Internal server error' }, 500);
    }
}

export async function handleRenameFolder(c, payload) {
    try {
        const body = await c.req.json();
        const nameErr = validateFolderName(body);
        if (nameErr) return c.json({ error: nameErr }, 400);
        await folderService.renameFolder(c.req.param('id'), payload.userId, body.name.trim());
        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: 'Internal server error' }, 500);
    }
}

export async function handleDeleteFolder(c, payload) {
    await folderService.deleteFolder(c.req.param('id'), payload.userId);
    return c.json({ success: true });
}
