import { validateWorkflow } from '../models/workflow.model.js';

export function validateTemplatePayload(body, partial = false) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Body request tidak valid';
    if (!partial && (typeof body.name !== 'string' || !body.name.trim())) return 'Nama template diperlukan';
    if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 255)) return 'Nama template tidak valid';
    if (body.description !== undefined && (typeof body.description !== 'string' || body.description.length > 2000)) return 'Deskripsi template tidak valid';
    if (body.category !== undefined && (typeof body.category !== 'string' || !body.category.trim() || body.category.trim().length > 100)) return 'Kategori template tidak valid';
    if (body.data !== undefined) {
        const error = validateWorkflow(body.data);
        if (error) return error;
    }
    return null;
}
