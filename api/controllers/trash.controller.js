import * as projectService from '../services/project.service.js';

export async function handleTrashProject(c, payload) {
    await projectService.trashProject(c.req.param('id'), payload.userId);
    return c.json({ success: true });
}

export async function handleRestoreProject(c, payload) {
    await projectService.restoreProject(c.req.param('id'), payload.userId);
    return c.json({ success: true });
}

export async function handleDuplicateProject(c, payload) {
    try {
        const body = await c.req.json();
        const project = await projectService.duplicateProject(c.req.param('id'), payload.userId, body.name);
        if (!project) return c.json({ error: 'Project tidak ditemukan' }, 404);
        return c.json({ project });
    } catch (e) {
        return c.json({ error: e.message || 'Gagal duplikat project' }, 500);
    }
}

export async function handleTrashFolder(c, payload) {
    const folderService = await import('../services/folder.service.js');
    await folderService.trashFolder(c.req.param('id'), payload.userId);
    return c.json({ success: true });
}

export async function handleRestoreFolder(c, payload) {
    const folderService = await import('../services/folder.service.js');
    await folderService.restoreFolder(c.req.param('id'), payload.userId);
    return c.json({ success: true });
}

export async function handleDuplicateFolder(c, payload) {
    try {
        const folderService = await import('../services/folder.service.js');
        const folder = await folderService.duplicateFolder(c.req.param('id'), payload.userId);
        if (!folder) return c.json({ error: 'Folder tidak ditemukan' }, 404);
        return c.json({ folder });
    } catch (e) {
        return c.json({ error: e.message || 'Gagal duplikat folder' }, 500);
    }
}

export async function handleListTrash(c, payload) {
    const result = await projectService.listTrashed(payload.userId);
    return c.json(result);
}
