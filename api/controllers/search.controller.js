import * as tagRepo from '../repositories/tag.repository.js';
import { normalizeProject } from '../models/project.model.js';

export async function handleSearch(c, payload) {
    const query = c.req.query('q') || '';
    const folderId = c.req.query('folder') || undefined;
    const tag = c.req.query('tag') || undefined;
    const from = c.req.query('from') || undefined;
    const to = c.req.query('to') || undefined;
    const archived = c.req.query('archived') !== undefined ? c.req.query('archived') === 'true' : undefined;

    const rows = await tagRepo.searchProjects(payload.userId, { query, folderId, tag, from, to, archived });
    const projects = rows.map(normalizeProject);
    return c.json({ projects, total: projects.length, query });
}

export async function handleAddTag(c, payload) {
    const projectId = c.req.param('id');
    const body = await c.req.json();
    if (!body.tag) return c.json({ error: 'Tag diperlukan' }, 400);
    await tagRepo.addTag(projectId, payload.userId, body.tag.trim());
    return c.json({ success: true });
}

export async function handleRemoveTag(c, payload) {
    const projectId = c.req.param('id');
    const tag = c.req.param('tag');
    await tagRepo.removeTag(projectId, payload.userId, decodeURIComponent(tag));
    return c.json({ success: true });
}

export async function handleGetProjectTags(c, payload) {
    const projectId = c.req.param('id');
    const tags = await tagRepo.getTagsByProject(projectId, payload.userId);
    return c.json({ tags });
}

export async function handleListAllTags(c, payload) {
    const tags = await tagRepo.getAllUserTags(payload.userId);
    return c.json({ tags });
}
