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
