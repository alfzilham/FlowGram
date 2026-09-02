import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWorkflow } from '../api/models/workflow.model.js';
import { validateAiOperations } from '../api/validators/ai.validator.js';

test('workflow accepts an optional Mermaid diagram', () => {
    assert.equal(validateWorkflow({ nodes: [], connections: [], diagram: { type: 'mermaid', source: 'graph TD\nA --> B' } }), null);
});

test('workflow rejects unsupported diagram types', () => {
    assert.match(validateWorkflow({ nodes: [], connections: [], diagram: { type: 'html', source: '<script>' } }), /Tipe diagram/);
});

test('AI node patches cannot mutate protected fields', () => {
    assert.match(validateAiOperations([{ op: 'update_node', id: 'n1', patch: { id: 'victim' } }]), /Patch node/);
    assert.equal(validateAiOperations([{ op: 'update_node', id: 'n1', patch: { text: 'Updated', x: 10 } }]), null);
});
