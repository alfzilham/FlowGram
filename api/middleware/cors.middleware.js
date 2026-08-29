import { cors } from 'hono/cors';
import config from '../config/index.js';

export function createCors() {
    return cors({
        origin: function (origin) {
            if (!origin) return undefined;
            if (config.isDev && origin.includes('localhost')) return origin;
            if (config.allowedOrigins.includes(origin)) return origin;
            return undefined;
        },
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization']
    });
}
