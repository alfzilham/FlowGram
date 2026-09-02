import config from '../config/index.js';
import { validateWorkflow } from '../models/workflow.model.js';

const MAX_INSTRUCTION_LENGTH = 4000;
const MAX_OPERATIONS = 100;

function extractContent(payload) {
    const content = payload?.choices?.[0]?.message?.content ?? payload?.content;
    if (typeof content !== 'string') throw new Error('Respons AI tidak memiliki content');
    return content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
}

function validateOperation(op) {
    if (!op || typeof op !== 'object' || typeof op.op !== 'string') return 'Operasi AI tidak valid';
    if (!['add_node', 'update_node', 'delete_node', 'add_connection', 'delete_connection', 'set_diagram'].includes(op.op)) return 'Operasi AI tidak didukung';
    if (op.op === 'set_diagram') {
        if (!op.diagram || !['mermaid', 'markdown'].includes(op.diagram.type) || typeof op.diagram.source !== 'string' || op.diagram.source.length > 100000) return 'Operasi diagram AI tidak valid';
    } else if (op.op === 'add_node') {
        if (!op.node || typeof op.node.id !== 'string') return 'Node baru AI tidak valid';
    } else if (op.op === 'add_connection') {
        if (!op.connection || typeof op.connection.id !== 'string') return 'Koneksi baru AI tidak valid';
    } else if (typeof op.id !== 'string' || !op.id) return 'ID operasi AI tidak valid';
    return null;
}

function applyOperations(workflow, operations) {
    const result = JSON.parse(JSON.stringify(workflow));
    result.nodes = Array.isArray(result.nodes) ? result.nodes : [];
    result.connections = Array.isArray(result.connections) ? result.connections : [];
    for (const op of operations) {
        if (op.op === 'add_node') result.nodes.push(op.node);
        if (op.op === 'update_node') {
            const node = result.nodes.find(n => n.id === op.id);
            if (!node) throw new Error('Node target tidak ditemukan');
            Object.assign(node, op.patch || {});
        }
        if (op.op === 'delete_node') {
            result.nodes = result.nodes.filter(n => n.id !== op.id);
            result.connections = result.connections.filter(c => c.from?.nodeId !== op.id && c.to?.nodeId !== op.id);
        }
        if (op.op === 'add_connection') result.connections.push(op.connection);
        if (op.op === 'delete_connection') result.connections = result.connections.filter(c => c.id !== op.id);
        if (op.op === 'set_diagram') result.diagram = op.diagram;
    }
    return result;
}

export async function assist({ instruction, workflow }) {
    if (!config.aiApiUrl || !config.aiApiKey) throw Object.assign(new Error('AI provider belum dikonfigurasi'), { status: 503 });
    if (typeof instruction !== 'string' || !instruction.trim() || instruction.length > MAX_INSTRUCTION_LENGTH) throw Object.assign(new Error('Instruksi AI tidak valid'), { status: 400 });
    const workflowError = validateWorkflow(workflow);
    if (workflowError) throw Object.assign(new Error(workflowError), { status: 400 });

    const system = `You are FlowGram's workflow editing assistant. Return JSON only: {"summary": string, "operations": []}. Allowed operations are add_node {node:{id,x,y,text,color,icon}}, update_node {id,patch:{x,y,text,color,icon}}, delete_node {id}, add_connection {connection:{id,from:{nodeId,side},to:{nodeId,side}}}, delete_connection {id}, set_diagram {diagram:{type:"mermaid"|"markdown",source:string}}. Never return HTML, scripts, URLs for execution, credentials, user identity, or unknown fields. Keep operations minimal and preserve existing IDs unless changing the requested object.`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let response;
    try {
        response = await fetch(config.aiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.aiApiKey },
            body: JSON.stringify({ model: config.aiModel, temperature: 0.1, response_format: { type: 'json_object' }, messages: [
                { role: 'system', content: system },
                { role: 'user', content: JSON.stringify({ instruction: instruction.trim(), workflow }) }
            ] }),
            signal: controller.signal
        });
    } finally { clearTimeout(timeout); }
    if (!response.ok) throw Object.assign(new Error('AI provider request gagal'), { status: 502 });
    const parsed = JSON.parse(extractContent(await response.json()));
    if (!Array.isArray(parsed.operations) || parsed.operations.length > MAX_OPERATIONS) throw Object.assign(new Error('Respons operasi AI tidak valid'), { status: 502 });
    for (const op of parsed.operations) {
        const error = validateOperation(op);
        if (error) throw Object.assign(new Error(error), { status: 502 });
    }
    try {
        const finalWorkflow = applyOperations(workflow, parsed.operations);
        const finalError = validateWorkflow(finalWorkflow);
        if (finalError) throw new Error(finalError);
    } catch (e) { throw Object.assign(new Error('Operasi AI menghasilkan workflow tidak valid'), { status: 502 }); }
    return { summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 1000) : 'Perubahan siap ditinjau.', operations: parsed.operations };
}
