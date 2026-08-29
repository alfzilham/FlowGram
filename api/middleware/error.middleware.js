export function errorHandler(err, c) {
    console.error('Unhandled error:', err);
    return c.json({ error: 'Internal server error' }, 500);
}
