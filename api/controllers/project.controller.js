import * as projectService from '../services/project.service.js';
import { validateProjectData, validateFolderId } from '../validators/project.validator.js';
import { validateWorkflow, validateImportPayload, migrateV0ToV1, SCHEMA_VERSION } from '../models/workflow.model.js';

export async function handleListProjects(c, payload) {
    const projects = await projectService.listProjects(payload.userId);
    return c.json({ projects });
}

export async function handleGetProject(c, payload) {
    const project = await projectService.getProject(c.req.param('id'), payload.userId);
    if (!project) return c.json({ error: 'Not found' }, 404);
    return c.json({ project });
}

export async function handleCreateProject(c, payload) {
    try {
        const body = await c.req.json();
        const folderErr = validateFolderId(body);
        if (folderErr) return c.json({ error: folderErr }, 400);
        const dataErr = validateProjectData(body);
        if (dataErr) return c.json({ error: dataErr }, 400);

        const project = await projectService.createProject(payload.userId, body);
        return c.json({ project });
    } catch (e) {
        if (e && e.status === 400) return c.json({ error: e.message }, 400);
        return c.json({ error: 'Internal server error' }, 500);
    }
}

export async function handleUpdateProject(c, payload) {
    try {
        const body = await c.req.json();
        const folderErr = validateFolderId(body);
        if (folderErr) return c.json({ error: folderErr }, 400);
        const dataErr = validateProjectData(body);
        if (dataErr) return c.json({ error: dataErr }, 400);

        await projectService.updateProject(c.req.param('id'), payload.userId, body);
        return c.json({ success: true });
    } catch (e) {
        if (e && e.status === 400) return c.json({ error: e.message }, 400);
        return c.json({ error: 'Internal server error' }, 500);
    }
}

export async function handleAutosave(c, payload) {
    try {
        const body = await c.req.json();
        if (!body.data) return c.json({ error: 'Data workflow diperlukan' }, 400);

        const dataErr = validateProjectData(body);
        if (dataErr) return c.json({ error: dataErr }, 400);

        const result = await projectService.autosaveProject(c.req.param('id'), payload.userId, body.data);
        return c.json({ success: true, savedAt: result.savedAt });
    } catch (e) {
        if (e && e.status === 404) return c.json({ error: e.message }, 404);
        if (e && e.status === 400) return c.json({ error: e.message }, 400);
        return c.json({ error: 'Internal server error' }, 500);
    }
}

export async function handleImport(c, payload) {
    try {
        const body = await c.req.json();
        const importErr = validateImportPayload(body);
        if (importErr) return c.json({ error: importErr }, 400);

        let importData = body;
        if (!importData.schemaVersion) {
            importData = migrateV0ToV1(importData);
        }

        const proj = importData.project || {};
        const project = await projectService.createProject(payload.userId, {
            name: proj.name || 'Imported Workflow',
            folderId: proj.folderId || null,
            color: proj.color || null,
            data: proj.data || { nodes: [], connections: [] }
        });
        return c.json({ project });
    } catch (e) {
        return c.json({ error: e.message || 'Gagal import' }, 400);
    }
}

export async function handleValidateWorkflow(c) {
    try {
        const body = await c.req.json();
        if (!body.data) return c.json({ valid: false, errors: ['Data workflow diperlukan'] }, 400);

        const err = validateWorkflow(body.data);
        if (err) return c.json({ valid: false, errors: [err] });
        return c.json({ valid: true, errors: [] });
    } catch (e) {
        return c.json({ valid: false, errors: ['Invalid JSON'] }, 400);
    }
}

export async function handleDeleteProject(c, payload) {
    await projectService.deleteProject(c.req.param('id'), payload.userId);
    return c.json({ success: true });
}
