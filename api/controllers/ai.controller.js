import * as aiService from '../services/ai.service.js';

export async function handleAssist(c, payload) {
    try {
        const body = await c.req.json();
        const result = await aiService.assist({ instruction: body.instruction, workflow: body.workflow });
        console.info(JSON.stringify({ event: 'ai_assist', userId: payload.userId, operationCount: result.operations.length }));
        return c.json(result);
    } catch (e) {
        if (e?.status === 400 || e?.status === 503 || e?.status === 502) return c.json({ error: e.message }, e.status);
        return c.json({ error: 'Internal server error' }, 500);
    }
}
