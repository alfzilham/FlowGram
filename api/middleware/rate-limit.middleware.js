const rateLimits = new Map();
const WINDOW_MS = 60000; // 1 minute

function getKey(ip, route) {
    return ip + ':' + route;
}

function cleanOldEntries(now) {
    for (const [key, entry] of rateLimits) {
        if (now - entry.windowStart > WINDOW_MS * 2) {
            rateLimits.delete(key);
        }
    }
}

export function createRateLimit(maxRequests) {
    return async function rateLimit(c, next) {
        // Forwarded headers are client-controlled unless a trusted proxy is configured.
        const ip = process.env.TRUST_PROXY === 'true'
            ? (c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown').split(',')[0].trim()
            : 'direct-client';
        const route = c.req.path;
        const now = Date.now();
        const key = getKey(ip, route);

        if (now % 1000 < 10) cleanOldEntries(now);

        let entry = rateLimits.get(key);
        if (!entry || now - entry.windowStart > WINDOW_MS) {
            entry = { count: 0, windowStart: now };
            rateLimits.set(key, entry);
        }

        entry.count++;

        if (entry.count > maxRequests) {
            const retryAfter = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000);
            c.header('Retry-After', String(retryAfter));
            return c.json({ error: 'Terlalu banyak request. Coba lagi nanti.' }, 429);
        }

        await next();
    };
}

export const loginRateLimit = createRateLimit(10);
export const projectRateLimit = createRateLimit(60);
export const folderRateLimit = createRateLimit(30);
