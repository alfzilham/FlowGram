const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

export async function enforceRequestLimit(c, next) {
    const contentLength = Number(c.req.header('content-length') || 0);

    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
        return c.json({ error: 'Request body too large' }, 413);
    }

    await next();
}
