export function requestLogger() {
    return async (c, next) => {
        const start = Date.now();
        await next();
        const duration = Date.now() - start;

        const log = {
            timestamp: new Date().toISOString(),
            method: c.req.method,
            path: c.req.path,
            status: c.res.status,
            duration: duration,
            ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
        };

        // Add userId if available from JWT (without logging the token)
        try {
            const auth = c.req.header('Authorization');
            if (auth && auth.startsWith('Bearer ')) {
                const jwt = await import('jsonwebtoken');
                const payload = jwt.default.verify(auth.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
                log.userId = payload.userId;
            }
        } catch { /* not authenticated — skip */ }

        // Never log: tokens, secrets, workflow data, passwords
        if (log.status >= 400) {
            console.error(JSON.stringify(log));
        } else if (log.path !== '/health') {
            console.log(JSON.stringify(log));
        }
    };
}
