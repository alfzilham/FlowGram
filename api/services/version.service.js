import { uid } from '../_db.js';
import * as versionRepo from '../repositories/version.repository.js';

const MAX_VERSIONS = 50;

export async function listVersions(projectId, userId) {
    return versionRepo.findVersionsByProject(projectId, userId);
}

export async function getVersion(projectId, versionId, userId) {
    return versionRepo.findVersionById(projectId, versionId, userId);
}

export async function createSnapshot(projectId, userId, data, label) {
    const versionNumber = await versionRepo.getNextVersionNumber(projectId, userId);
    const id = uid('v');
    const version = await versionRepo.createVersion(id, projectId, userId, versionNumber, data, label);

    // Prune old versions if exceeding limit
    const count = await versionRepo.countVersions(projectId, userId);
    if (count > MAX_VERSIONS) {
        await versionRepo.pruneOldVersions(projectId, userId, MAX_VERSIONS);
    }

    return version;
}

export async function deleteVersion(projectId, versionId, userId) {
    await versionRepo.deleteVersion(projectId, versionId, userId);
}
