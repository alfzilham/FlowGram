const config = {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: '30d',
    databaseUrl: process.env.DATABASE_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    aiApiUrl: process.env.AI_API_URL || '',
    aiApiKey: process.env.AI_API_KEY || '',
    aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
    get isDev() {
        return !this.allowedOrigins.length;
    }
};

export default config;
