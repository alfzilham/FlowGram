import { uid } from '../_db.js';
import * as projectRepo from '../repositories/project.repository.js';
import * as folderRepo from '../repositories/folder.repository.js';

export async function listProjects(userId) {
    return projectRepo.findProjectsByUserId(userId);
}

export async function getProject(id, userId) {
    return projectRepo.findProjectByIdAndUser(id, userId);
}

export async function createProject(userId, body) {
    const folderId = body.folderId || null;
    if (folderId) {
        const valid = await folderRepo.findFolderByIdAndUser(folderId, userId);
        if (!valid) {
            const error = new Error('Folder tidak ditemukan atau bukan milik Anda');
            error.status = 400;
            throw error;
        }
    }
    const id = uid('p');
    const project = await projectRepo.createProject(id, userId, body.name || 'Untitled', folderId, body.color || null, body.data || {});
    return project;
}

export async function updateProject(id, userId, body) {
    if (body.folderId !== undefined) {
        if (body.folderId !== null && body.folderId !== '') {
            const valid = await folderRepo.findFolderByIdAndUser(body.folderId, userId);
            if (!valid) {
                const error = new Error('Folder tidak ditemukan atau bukan milik Anda');
                error.status = 400;
                throw error;
            }
        }
    }
    await projectRepo.updateProject(id, userId, body);
}

export async function autosaveProject(id, userId, data) {
    const existing = await projectRepo.findProjectByIdAndUser(id, userId);
    if (!existing) {
        const error = new Error('Project tidak ditemukan');
        error.status = 404;
        throw error;
    }
    await projectRepo.updateProjectData(id, userId, data);
    return { savedAt: new Date().toISOString() };
}

export async function deleteProject(id, userId) {
    await projectRepo.deleteProject(id, userId);
}

export async function trashProject(id, userId) {
    await projectRepo.softDeleteProject(id, userId);
}

export async function restoreProject(id, userId) {
    await projectRepo.restoreProject(id, userId);
}

export async function listTrashed(userId) {
    const projects = await projectRepo.findTrashedProjects(userId);
    const folders = await (await import('../repositories/folder.repository.js')).findTrashedFolders(userId);
    return { projects, folders };
}

export async function duplicateProject(id, userId, name) {
    return projectRepo.duplicateProject(id, userId, name);
}
