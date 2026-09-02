const PATCH_KEYS = new Set(['x', 'y', 'text', 'color', 'icon']);

export function validateAiOperations(operations) {
    if (!Array.isArray(operations) || operations.length > 100) return 'Operasi AI tidak valid';
    for (const op of operations) {
        if (!op || typeof op !== 'object' || typeof op.op !== 'string') return 'Operasi AI tidak valid';
        if (op.op === 'update_node') {
            if (typeof op.id !== 'string' || !op.patch || Object.keys(op.patch).some(key => !PATCH_KEYS.has(key))) return 'Patch node AI tidak valid';
        }
    }
    return null;
}
