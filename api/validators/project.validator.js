import { validateWorkflow } from '../models/workflow.model.js';

export function validateProjectData(body) {
    if (body.data) {
        const err = validateWorkflow(body.data);
        if (err) return err;
    }
    return null;
}

export function validateFolderId(body) {
    if (body.folderId !== null && body.folderId !== undefined && body.folderId !== '') {
        if (typeof body.folderId !== 'string') return 'folderId harus berupa string';
    }
    return null;
}
