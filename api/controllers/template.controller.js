import * as templateService from '../services/template.service.js';
import { validateTemplatePayload } from '../validators/template.validator.js';

export async function handleListTemplates(c, payload) {
    const templates = await templateService.listTemplates(payload.userId);
    return c.json({ templates });
}

export async function handleGetTemplate(c, payload) {
    const template = await templateService.getTemplate(c.req.param('id'), payload.userId);
    if (!template) return c.json({ error: 'Template not found' }, 404);
    return c.json({ template });
}

export async function handleCreateTemplate(c, payload) {
    try {
        const body = await c.req.json();
        const validationError = validateTemplatePayload(body);
        if (validationError) return c.json({ error: validationError }, 400);
        const template = await templateService.createTemplate(payload.userId, body);
        return c.json({ template });
    } catch (e) {
        return c.json({ error: e.message || 'Gagal membuat template' }, 500);
    }
}

export async function handleUpdateTemplate(c, payload) {
    try {
        const body = await c.req.json();
        const validationError = validateTemplatePayload(body, true);
        if (validationError) return c.json({ error: validationError }, 400);
        await templateService.updateTemplate(c.req.param('id'), payload.userId, body);
        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: e.message || 'Gagal update template' }, 500);
    }
}

export async function handleDeleteTemplate(c, payload) {
    await templateService.deleteTemplate(c.req.param('id'), payload.userId);
    return c.json({ success: true });
}

export async function handleInstantiateTemplate(c, payload) {
    try {
        const body = await c.req.json();
        const project = await templateService.instantiateTemplate(c.req.param('id'), payload.userId, body.name);
        return c.json({ project });
    } catch (e) {
        if (e.status === 404) return c.json({ error: e.message }, 404);
        return c.json({ error: e.message || 'Gagal membuat project dari template' }, 500);
    }
}
