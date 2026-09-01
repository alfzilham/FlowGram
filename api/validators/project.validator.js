import { validateWorkflow } from '../models/workflow.model.js';

const VALID_COLORS = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

export function validateProjectData(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Body request tidak valid';
    if (body.data !== undefined && body.data !== null) {
        const err = validateWorkflow(body.data);
        if (err) return err;
    }
    if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 255)) {
        return 'Nama project tidak valid';
    }
    if (body.color !== undefined && body.color !== null && !VALID_COLORS.includes(body.color)) {
        return 'Warna project tidak valid';
    }
    if (body.archived !== undefined && typeof body.archived !== 'boolean') {
        return 'Status archive tidak valid';
    }
    return null;
}

export function validateFolderId(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Body request tidak valid';
    if (body.folderId !== null && body.folderId !== undefined && body.folderId !== '') {
        if (typeof body.folderId !== 'string') return 'folderId harus berupa string';
    }
    return null;
}
