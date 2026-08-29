const VALID_SIDES = ['top', 'right', 'bottom', 'left'];
const VALID_COLORS = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
const MAX_NODES = 500;
const MAX_CONNECTIONS = 1000;
const MAX_TEXT_LENGTH = 500;
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024;

export function validateWorkflow(data) {
    if (!data || typeof data !== 'object') return 'Data workflow harus berupa object';
    if (JSON.stringify(data).length > MAX_PAYLOAD_BYTES) return 'Payload workflow terlalu besar (maks 2MB)';

    const nodes = data.nodes;
    const connections = data.connections;

    if (!Array.isArray(nodes)) return 'nodes harus berupa array';
    if (!Array.isArray(connections)) return 'connections harus berupa array';
    if (nodes.length > MAX_NODES) return `Jumlah node terlalu banyak (maks ${MAX_NODES})`;
    if (connections.length > MAX_CONNECTIONS) return `Jumlah koneksi terlalu banyak (maks ${MAX_CONNECTIONS})`;

    const nodeIds = new Set();
    for (const n of nodes) {
        if (!n || typeof n !== 'object') return 'Setiap node harus berupa object';
        if (typeof n.id !== 'string' || !n.id) return 'Node harus memiliki id string';
        if (nodeIds.has(n.id)) return 'Node ID duplikat: ' + n.id;
        nodeIds.add(n.id);
        if (typeof n.x !== 'number' || !isFinite(n.x)) return 'Node x harus angka finite';
        if (typeof n.y !== 'number' || !isFinite(n.y)) return 'Node y harus angka finite';
        if (typeof n.text === 'string' && n.text.length > MAX_TEXT_LENGTH) return 'Teks node terlalu panjang (maks ' + MAX_TEXT_LENGTH + ' karakter)';
        if (n.color && !VALID_COLORS.includes(n.color)) return 'Warna tidak valid: ' + n.color;
        if (n.icon !== null && n.icon !== undefined && typeof n.icon !== 'string') return 'Icon harus string atau null';
    }

    const connIds = new Set();
    for (const c of connections) {
        if (!c || typeof c !== 'object') return 'Setiap koneksi harus berupa object';
        if (typeof c.id !== 'string' || !c.id) return 'Koneksi harus memiliki id string';
        if (connIds.has(c.id)) return 'Connection ID duplikat: ' + c.id;
        connIds.add(c.id);
        if (!c.from || typeof c.from !== 'object') return 'Koneksi harus memiliki from';
        if (!c.to || typeof c.to !== 'object') return 'Koneksi harus memiliki to';
        if (!nodeIds.has(c.from.nodeId)) return 'Koneksi reference node yang tidak ada: ' + c.from.nodeId;
        if (!nodeIds.has(c.to.nodeId)) return 'Koneksi reference node yang tidak ada: ' + c.to.nodeId;
        if (!VALID_SIDES.includes(c.from.side)) return 'Side tidak valid: ' + c.from.side;
        if (!VALID_SIDES.includes(c.to.side)) return 'Side tidak valid: ' + c.to.side;
    }

    return null;
}
