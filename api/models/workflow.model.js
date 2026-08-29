const VALID_SIDES = ['top', 'right', 'bottom', 'left'];
const VALID_COLORS = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
const MAX_NODES = 500;
const MAX_CONNECTIONS = 1000;
const MAX_TEXT_LENGTH = 500;
const MAX_ID_LENGTH = 200;
const MAX_COORDINATE = 1000000;
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024;
const VALID_ICONS = new Set([
    'zap', 'play', 'circle-play', 'arrow-right-circle', 'database', 'file-text', 'table', 'file', 'mail',
    'message-circle', 'bell', 'share-2', 'image', 'camera', 'music', 'video', 'code', 'terminal', 'globe',
    'git-branch', 'user', 'users', 'settings', 'sliders', 'star', 'heart', 'clock', 'calendar', 'check-circle',
    'flag', 'brain', 'bot', 'sparkles', 'cpu', 'wand-2', 'scan-eye', 'git-pull-request', 'palette', 'link-2',
    'hash', 'monitor', 'smartphone', 'tablet', 'watch', 'hard-drive', 'keyboard', 'mouse', 'wifi', 'clipboard-list',
    'folder-open', 'pen-tool', 'file-edit', 'search', 'filter', 'refresh-cw', 'download', 'upload', 'trash-2',
    'credit-card', 'shopping-cart', 'gift', 'trophy', 'award', 'trending-up', 'bar-chart-3', 'pie-chart'
]);

export function validateWorkflow(data) {
    if (!data || typeof data !== 'object') return 'Data workflow harus berupa object';
    let serialized;
    try { serialized = JSON.stringify(data); }
    catch { return 'Data workflow tidak dapat diserialisasi'; }
    if (new TextEncoder().encode(serialized).length > MAX_PAYLOAD_BYTES) return 'Payload workflow terlalu besar (maks 2MB)';

    const nodes = data.nodes;
    const connections = data.connections;

    if (!Array.isArray(nodes)) return 'nodes harus berupa array';
    if (!Array.isArray(connections)) return 'connections harus berupa array';
    if (nodes.length > MAX_NODES) return `Jumlah node terlalu banyak (maks ${MAX_NODES})`;
    if (connections.length > MAX_CONNECTIONS) return `Jumlah koneksi terlalu banyak (maks ${MAX_CONNECTIONS})`;

    const nodeIds = new Set();
    for (const n of nodes) {
        if (!n || typeof n !== 'object') return 'Setiap node harus berupa object';
        if (typeof n.id !== 'string' || !n.id || n.id.length > MAX_ID_LENGTH) return 'Node harus memiliki id string yang valid';
        if (nodeIds.has(n.id)) return 'Node ID duplikat: ' + n.id;
        nodeIds.add(n.id);
        if (typeof n.x !== 'number' || !isFinite(n.x) || Math.abs(n.x) > MAX_COORDINATE) return 'Node x tidak valid';
        if (typeof n.y !== 'number' || !isFinite(n.y) || Math.abs(n.y) > MAX_COORDINATE) return 'Node y tidak valid';
        if (typeof n.text !== 'string' || n.text.length > MAX_TEXT_LENGTH) return 'Teks node tidak valid';
        if (n.color && !VALID_COLORS.includes(n.color)) return 'Warna tidak valid: ' + n.color;
        if (n.icon !== null && n.icon !== undefined && (!VALID_ICONS.has(n.icon))) return 'Icon tidak valid';
    }

    const connIds = new Set();
    for (const c of connections) {
        if (!c || typeof c !== 'object') return 'Setiap koneksi harus berupa object';
        if (typeof c.id !== 'string' || !c.id || c.id.length > MAX_ID_LENGTH) return 'Koneksi harus memiliki id string yang valid';
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
