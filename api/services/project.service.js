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
        if (!valid) throw new Error('Folder tidak ditemukan atau bukan milik Anda');
    }
    const id = uid('p');
    const project = await projectRepo.createProject(id, userId, body.name || 'Untitled', folderId, body.data || {});
    return project;
}

export async function updateProject(id, userId, body) {
    if (body.folderId !== undefined) {
        if (body.folderId !== null && body.folderId !== '') {
            const valid = await folderRepo.findFolderByIdAndUser(body.folderId, userId);
            if (!valid) throw new Error('Folder tidak ditemukan atau bukan milik Anda');
        }
    }
    await projectRepo.updateProject(id, userId, body);
}

export async function deleteProject(id, userId) {
    await projectRepo.deleteProject(id, userId);
}
