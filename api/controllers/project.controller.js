import * as projectService from '../services/project.service.js';
import { validateProjectData, validateFolderId } from '../validators/project.validator.js';

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

export async function handleDeleteProject(c, payload) {
    await projectService.deleteProject(c.req.param('id'), payload.userId);
    return c.json({ success: true });
}
