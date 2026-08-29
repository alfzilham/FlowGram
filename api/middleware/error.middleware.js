export function errorHandler() {
    return async (c, next) => {
        try {
            await next();
        } catch (e) {
            console.error('Unhandled error:', e);
            return c.json({ error: 'Internal server error' }, 500);
        }
    };
}
