import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export function verifyJWT(c) {
    const auth = c.req.header('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch {
        return null;
    }
}

export function requireAuth(c) {
    const payload = verifyJWT(c);
    if (!payload) {
        return { error: c.json({ error: 'Unauthorized' }, 401) };
    }
    return { payload };
}
