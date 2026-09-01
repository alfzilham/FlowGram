import * as workspaceService from '../services/workspace.service.js';

export async function handleExport(c, payload) {
    const data = await workspaceService.exportWorkspace(payload.userId);
    return c.json(data);
}

export async function handleImport(c, payload) {
    try {
        const body = await c.req.json();
        const result = await workspaceService.importWorkspace(payload.userId, body);
        return c.json(result);
    } catch (e) {
        return c.json({ error: e.message || 'Gagal import workspace' }, 500);
    }
}
