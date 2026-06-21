import { Hono } from 'hono';
import { cors } from 'hono/cors';
import jwt from 'jsonwebtoken';
import { pool, uid } from './_db.js';

const app = new Hono();

app.use('/*', cors({ origin: '*', credentials: true }));

/* ---------- helpers ---------- */
function getToken(c) {
    const auth = c.req.header('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    return auth.slice(7);
}

function verifyJWT(c) {
    const token = getToken(c);
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

/* ---------- POST /api/auth/google ---------- */
app.post('/api/auth/google', async (c) => {
    try {
        const { googleToken } = await c.req.json();
        if (!googleToken) return c.json({ error: 'Missing googleToken' }, 400);

        const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: 'Bearer ' + googleToken }
        });
        if (!resp.ok) return c.json({ error: 'Token Google tidak valid' }, 401);
        const profile = await resp.json();

        const googleId = profile.sub;
        const email = profile.email;
        const name = profile.name || email.split('@')[0];
        const avatarUrl = profile.picture || null;

        const { rows: existing } = await pool.query(
            'SELECT id, email, name, avatar_url FROM users WHERE google_id = $1',
            [googleId]
        );

        let user, isNew = false;
        if (existing.length > 0) {
            user = existing[0];
            // Mark as new if user has no name set (onboarding incomplete)
            isNew = !user.name;
        } else {
            const id = uid('u');
            await pool.query(
                'INSERT INTO users (id, email, name, avatar_url, google_id) VALUES ($1,$2,$3,$4,$5)',
                [id, email, name, avatarUrl, googleId]
            );
            user = { id, email, name, avatar_url: avatarUrl };
            isNew = true;
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        return c.json({ token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url }, isNew });
    } catch (e) {
        console.error('Auth google error:', e);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

/* ---------- GET /api/auth/me ---------- */
app.get('/api/auth/me', async (c) => {
    const payload = verifyJWT(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const { rows } = await pool.query(
        'SELECT id, email, name, avatar_url FROM users WHERE id = $1',
        [payload.userId]
    );
    if (rows.length === 0) return c.json({ error: 'User not found' }, 404);

    const u = rows[0];
    return c.json({ user: { id: u.id, email: u.email, name: u.name, avatarUrl: u.avatar_url } });
});

/* ---------- POST /api/auth/name ---------- */
app.post('/api/auth/name', async (c) => {
    const payload = verifyJWT(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const { name } = await c.req.json();
    if (!name || !name.trim()) return c.json({ error: 'Nama tidak boleh kosong' }, 400);

    await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), payload.userId]);
    return c.json({ success: true, name: name.trim() });
});

/* ---------- GET /api/projects ---------- */
app.get('/api/projects', async (c) => {
    const payload = verifyJWT(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const { rows } = await pool.query(
        `SELECT id, name, folder_id, archived, color, node_count, created_at, updated_at
         FROM projects WHERE user_id = $1 ORDER BY updated_at DESC`,
        [payload.userId]
    );
    return c.json({ projects: rows });
});

/* ---------- POST /api/projects ---------- */
app.post('/api/projects', async (c) => {
    const payload = verifyJWT(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const id = uid('p');
    const now = new Date().toISOString();

    await pool.query(
        `INSERT INTO projects (id, user_id, name, folder_id, archived, color, node_count, data, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, payload.userId, body.name || 'Untitled', body.folderId || null, false, body.color || null,
         body.data?.nodes?.length || 0, JSON.stringify(body.data || {}), now, now]
    );

    return c.json({ project: { id, name: body.name || 'Untitled', folder_id: body.folderId || null, archived: false, color: body.color || null, node_count: body.data?.nodes?.length || 0, created_at: now, updated_at: now } });
});

/* ---------- GET /api/projects/:id ---------- */
app.get('/api/projects/:id', async (c) => {
    const payload = verifyJWT(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const { rows } = await pool.query(
        'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
        [c.req.param('id'), payload.userId]
    );
    if (rows.length === 0) return c.json({ error: 'Not found' }, 404);

    const p = rows[0];
    return c.json({ project: { ...p, data: typeof p.data === 'string' ? JSON.parse(p.data) : p.data } });
});

/* ---------- PUT /api/projects/:id ---------- */
app.put('/api/projects/:id', async (c) => {
    const payload = verifyJWT(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const updates = [];
    const vals = [];
    let idx = 1;

    if (body.name !== undefined) { updates.push('name = $' + idx++); vals.push(body.name); }
    if (body.folderId !== undefined) { updates.push('folder_id = $' + idx++); vals.push(body.folderId); }
    if (body.archived !== undefined) { updates.push('archived = $' + idx++); vals.push(body.archived); }
    if (body.color !== undefined) { updates.push('color = $' + idx++); vals.push(body.color); }
    if (body.data !== undefined) {
        const nodeCount = body.data.nodes?.length || 0;
        updates.push('data = $' + idx++);
        vals.push(JSON.stringify(body.data));
        updates.push('node_count = $' + idx++);
        vals.push(nodeCount);
    }
    updates.push('updated_at = NOW()');

    vals.push(c.req.param('id'), payload.userId);
    await pool.query(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = $${idx++} AND user_id = $${idx}`,
        vals
    );

    return c.json({ success: true });
});

/* ---------- DELETE /api/projects/:id ---------- */
app.delete('/api/projects/:id', async (c) => {
    const payload = verifyJWT(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2',
        [c.req.param('id'), payload.userId]);
    return c.json({ success: true });
});

/* ---------- GET /api/folders ---------- */
app.get('/api/folders', async (c) => {
    const payload = verifyJWT(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const { rows } = await pool.query(
        'SELECT id, name FROM folders WHERE user_id = $1 ORDER BY name',
        [payload.userId]
    );
    return c.json({ folders: rows });
});

/* ---------- POST /api/folders ---------- */
app.post('/api/folders', async (c) => {
    const payload = verifyJWT(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const id = uid('f');
    await pool.query(
        'INSERT INTO folders (id, user_id, name) VALUES ($1,$2,$3)',
        [id, payload.userId, body.name || 'New Folder']
    );
    return c.json({ folder: { id, name: body.name || 'New Folder' } });
});

/* ---------- PUT /api/folders/:id ---------- */
app.put('/api/folders/:id', async (c) => {
    const payload = verifyJWT(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    await pool.query(
        'UPDATE folders SET name = $1 WHERE id = $2 AND user_id = $3',
        [body.name, c.req.param('id'), payload.userId]
    );
    return c.json({ success: true });
});

/* ---------- DELETE /api/folders/:id ---------- */
app.delete('/api/folders/:id', async (c) => {
    const payload = verifyJWT(c);
    if (!payload) return c.json({ error: 'Unauthorized' }, 401);

    const folderId = c.req.param('id');
    await pool.query('UPDATE projects SET folder_id = null WHERE folder_id = $1 AND user_id = $2', [folderId, payload.userId]);
    await pool.query('DELETE FROM folders WHERE id = $1 AND user_id = $2', [folderId, payload.userId]);
    return c.json({ success: true });
});

export default app;
