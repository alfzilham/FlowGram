import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import api from '../api/index.js';

const app = new Hono();

app.use('*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
});

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/', api);
app.use('*', serveStatic({ root: './' }));

const port = Number(process.env.PORT || 3000);

serve({ fetch: app.fetch, port }, (info) => {
    console.log(`FlowGram listening on http://localhost:${info.port}`);
});
