import { uid } from '../_db.js';
import * as templateRepo from '../repositories/template.repository.js';
import * as projectRepo from '../repositories/project.repository.js';

export async function listTemplates(userId) {
    return templateRepo.findAllTemplates(userId);
}

export async function getTemplate(id, userId) {
    return templateRepo.findTemplateById(id, userId);
}

export async function createTemplate(userId, body) {
    const id = uid('t');
    return templateRepo.createTemplate(id, userId, body.name, body.description, body.category, body.data);
}

export async function updateTemplate(id, userId, body) {
    await templateRepo.updateTemplate(id, userId, body);
}

export async function deleteTemplate(id, userId) {
    await templateRepo.deleteTemplate(id, userId);
}

export async function instantiateTemplate(templateId, userId, projectName) {
    const template = await templateRepo.findTemplateById(templateId, userId);
    if (!template) throw Object.assign(new Error('Template tidak ditemukan'), { status: 404 });

    const data = template.data || {};
    const projectId = uid('p');
    const project = await projectRepo.createProject(
        projectId,
        userId,
        projectName || template.name + ' (Copy)',
        null,
        null,
        data
    );
    return project;
}
