import * as projectRepo from '../repositories/project.repository.js';
import * as folderRepo from '../repositories/folder.repository.js';
import * as templateRepo from '../repositories/template.repository.js';
import { pool } from '../_db.js';
import { validateWorkflow } from '../models/workflow.model.js';

export async function exportWorkspace(userId) {
    const projects = await projectRepo.findProjectsByUserId(userId);
    const folders = await folderRepo.findFoldersByUserId(userId);
    const templates = await templateRepo.findAllTemplates(userId);

    // Get full project data
    const fullProjects = [];
    for (const p of projects) {
        const full = await projectRepo.findProjectByIdAndUser(p.id, userId);
        if (full) fullProjects.push(full);
    }

    return {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        projects: fullProjects,
        folders: folders,
        templates: templates.filter(t => !t.is_builtin)
    };
}

export async function importWorkspace(userId, data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('Payload workspace tidak valid'), { status: 400 });
    if (data.schemaVersion !== undefined && data.schemaVersion !== 1) throw Object.assign(new Error('Schema workspace tidak didukung'), { status: 400 });
    if (data.folders && (!Array.isArray(data.folders) || data.folders.length > 500)) throw Object.assign(new Error('Jumlah folder terlalu banyak'), { status: 400 });
    if (data.projects && (!Array.isArray(data.projects) || data.projects.length > 500)) throw Object.assign(new Error('Jumlah project terlalu banyak'), { status: 400 });
    if (data.templates && (!Array.isArray(data.templates) || data.templates.length > 200)) throw Object.assign(new Error('Jumlah template terlalu banyak'), { status: 400 });
    let importedProjects = 0;
    let importedFolders = 0;
    let importedTemplates = 0;
    const folderMap = new Map();

    // Import folders first
    if (Array.isArray(data.folders)) {
        for (const f of data.folders) {
            try {
                if (!f || typeof f.name !== 'string' || !f.name.trim() || f.name.trim().length > 255) continue;
                const newId = 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
                await folderRepo.createFolder(newId, userId, f.name.trim());
                if (f.id) folderMap.set(f.id, newId);
                importedFolders++;
            } catch (e) { /* skip duplicates */ }
        }
    }

    // Import projects
    if (Array.isArray(data.projects)) {
        for (const p of data.projects) {
            try {
                if (!p || typeof p.name !== 'string' || !p.name.trim() || p.name.trim().length > 255) continue;
                const workflowError = validateWorkflow(p.data || { nodes: [], connections: [] });
                if (workflowError) continue;
                const id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
                const folderId = p.folder_id ? (folderMap.get(p.folder_id) || null) : null;
                await projectRepo.createProject(id, userId, p.name.trim(), folderId, p.color || null, p.data || {});
                importedProjects++;
            } catch (e) { /* skip duplicates */ }
        }
    }

    // Import user templates
    if (Array.isArray(data.templates)) {
        for (const t of data.templates) {
            try {
                if (!t || typeof t.name !== 'string' || !t.name.trim() || t.name.trim().length > 255) continue;
                const workflowError = validateWorkflow(t.data || { nodes: [], connections: [] });
                if (workflowError) continue;
                const id = 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
                await templateRepo.createTemplate(id, userId, t.name.trim(), t.description, t.category, t.data);
                importedTemplates++;
            } catch (e) { /* skip duplicates */ }
        }
    }

    return { imported: { projects: importedProjects, folders: importedFolders, templates: importedTemplates } };
}
