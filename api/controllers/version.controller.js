import * as versionService from '../services/version.service.js';

export async function handleListVersions(c, payload) {
    const projectId = c.req.param('id');
    const versions = await versionService.listVersions(projectId, payload.userId);
    return c.json({ versions });
}

export async function handleGetVersion(c, payload) {
    const projectId = c.req.param('id');
    const versionId = c.req.param('vid');
    const version = await versionService.getVersion(projectId, versionId, payload.userId);
    if (!version) return c.json({ error: 'Version not found' }, 404);
    return c.json({ version });
}

export async function handleCreateVersion(c, payload) {
    try {
        const projectId = c.req.param('id');
        const body = await c.req.json();
        if (!body.data) return c.json({ error: 'Data workflow diperlukan' }, 400);

        const version = await versionService.createSnapshot(projectId, payload.userId, body.data, body.label);
        return c.json({ version });
    } catch (e) {
        if (e && e.status === 400) return c.json({ error: e.message }, 400);
        if (e && e.status === 404) return c.json({ error: e.message }, 404);
        return c.json({ error: e.message || 'Gagal membuat versi' }, 500);
    }
}

export async function handleDeleteVersion(c, payload) {
    const projectId = c.req.param('id');
    const versionId = c.req.param('vid');
    await versionService.deleteVersion(projectId, versionId, payload.userId);
    return c.json({ success: true });
}
