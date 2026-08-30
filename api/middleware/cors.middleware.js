import { cors } from 'hono/cors';
import config from '../config/index.js';

export function createCors() {
    return cors({
        origin: function (origin) {
            if (!origin) return undefined;
            let parsed;
            try { parsed = new URL(origin); } catch { return undefined; }
            const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
            if (config.isDev && localHost) return origin;
            if (config.allowedOrigins.includes(origin)) return origin;
            return undefined;
        },
        // Authentication uses the Authorization header, not cookies.
        credentials: false,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization']
    });
}
