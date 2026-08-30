import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Neon Pool uses WebSockets in Node.js. The browser WebSocket global is not
// available in every supported Node runtime, so provide an explicit adapter.
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function uid(p) {
    return p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export { pool, uid };
