import * as projectRepo from '../repositories/project.repository.js';
import * as folderRepo from '../repositories/folder.repository.js';
import * as templateRepo from '../repositories/template.repository.js';
import { pool } from '../_db.js';

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
    let importedProjects = 0;
    let importedFolders = 0;
    let importedTemplates = 0;

    // Import folders first
    if (Array.isArray(data.folders)) {
        for (const f of data.folders) {
            try {
                await folderRepo.createFolder(f.id || ('f_' + Date.now().toString(36)), userId, f.name);
                importedFolders++;
            } catch (e) { /* skip duplicates */ }
        }
    }

    // Import projects
    if (Array.isArray(data.projects)) {
        for (const p of data.projects) {
            try {
                const id = p.id || ('p_' + Date.now().toString(36));
                await projectRepo.createProject(id, userId, p.name, p.folder_id || null, p.color || null, p.data || {});
                importedProjects++;
            } catch (e) { /* skip duplicates */ }
        }
    }

    // Import user templates
    if (Array.isArray(data.templates)) {
        for (const t of data.templates) {
            try {
                const id = t.id || ('t_' + Date.now().toString(36));
                await templateRepo.createTemplate(id, userId, t.name, t.description, t.category, t.data);
                importedTemplates++;
            } catch (e) { /* skip duplicates */ }
        }
    }

    return { imported: { projects: importedProjects, folders: importedFolders, templates: importedTemplates } };
}
