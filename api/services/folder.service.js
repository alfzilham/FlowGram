import { uid } from '../_db.js';
import * as folderRepo from '../repositories/folder.repository.js';

export async function listFolders(userId) {
    return folderRepo.findFoldersByUserId(userId);
}

export async function createFolder(userId, name) {
    const id = uid('f');
    return folderRepo.createFolder(id, userId, name || 'New Folder');
}

export async function renameFolder(id, userId, name) {
    await folderRepo.updateFolderName(id, userId, name);
}

export async function deleteFolder(id, userId) {
    await folderRepo.deleteFolderAndUnlinkProjects(id, userId);
}

export async function trashFolder(id, userId) {
    await folderRepo.softDeleteFolder(id, userId);
}

export async function restoreFolder(id, userId) {
    await folderRepo.restoreFolder(id, userId);
}

export async function duplicateFolder(id, userId) {
    const src = await folderRepo.findFolderByIdAndUser(id, userId);
    if (!src) return null;

    const newId = uid('f');
    const folders = await folderRepo.findFoldersByUserId(userId);
    const srcFolder = folders.find(f => f.id === id);
    const newFolder = await folderRepo.createFolder(newId, userId, srcFolder ? srcFolder.name + ' (Copy)' : 'Copy');

    // Duplicate projects in this folder
    const projectRepo = await import('../repositories/project.repository.js');
    const projects = await projectRepo.findProjectsByUserId(userId);
    const projectsInFolder = projects.filter(p => p.folder_id === id);
    for (const p of projectsInFolder) {
        await projectRepo.duplicateProject(p.id, userId, p.name, newId);
    }

    return newFolder;
}
