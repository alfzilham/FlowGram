import * as authService from '../services/auth.service.js';
import { validateGoogleToken, validateName } from '../validators/auth.validator.js';
import * as userRepo from '../repositories/user.repository.js';

export async function handleGoogleLogin(c) {
    try {
        const body = await c.req.json();
        const err = validateGoogleToken(body);
        if (err) return c.json({ error: err }, 400);

        const result = await authService.exchangeGoogleToken(body.googleToken);
        return c.json(result);
    } catch (e) {
        console.error('Auth google error:', e);
        return c.json({ error: 'Internal server error' }, 500);
    }
}

export async function handleGetMe(c, payload) {
    const user = await userRepo.findUserById(payload.userId);
    if (!user) return c.json({ error: 'User not found' }, 404);
    return c.json({ user });
}

export async function handleUpdateName(c, payload) {
    try {
        const body = await c.req.json();
        const err = validateName(body);
        if (err) return c.json({ error: err }, 400);

        const name = await authService.updateName(payload.userId, body.name);
        return c.json({ success: true, name });
    } catch (e) {
        return c.json({ error: e.message || 'Gagal update nama' }, 500);
    }
}

export async function handleDeleteAccount(c, payload) {
    try {
        await authService.deleteAccount(payload.userId);
        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: e.message || 'Gagal hapus akun' }, 500);
    }
}
