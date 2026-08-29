import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { uid } from '../_db.js';
import * as userRepo from '../repositories/user.repository.js';

export async function exchangeGoogleToken(googleToken) {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: 'Bearer ' + googleToken }
    });
    if (!resp.ok) throw new Error('Token Google tidak valid');

    const profile = await resp.json();
    if (!profile.sub || typeof profile.sub !== 'string') throw new Error('Google profile tidak valid');
    if (!profile.email || typeof profile.email !== 'string') throw new Error('Google profile tidak valid');

    const googleId = profile.sub;
    const email = profile.email;
    const name = profile.name || email.split('@')[0];
    const avatarUrl = profile.picture || null;

    let user = await userRepo.findUserByGoogleId(googleId);
    let isNew = false;

    if (user) {
        isNew = !user.name;
    } else {
        const id = uid('u');
        await userRepo.createUser(id, email, name, avatarUrl, googleId);
        user = { id, email, name, avatar_url: avatarUrl };
        isNew = true;
    }

    const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );

    return {
        token,
        user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url },
        isNew
    };
}

export async function updateName(userId, name) {
    await userRepo.updateUserName(userId, name.trim());
    return name.trim();
}

export async function deleteAccount(userId) {
    const projectRepo = await import('../repositories/project.repository.js');
    const folderRepo = await import('../repositories/folder.repository.js');
    await projectRepo.deleteProjectsByUserId(userId);
    await folderRepo.deleteFoldersByUserId(userId);
    await userRepo.deleteUser(userId);
}
