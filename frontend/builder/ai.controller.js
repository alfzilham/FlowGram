(function () {
    "use strict";

    var panel = document.getElementById('ai-panel');
    var instruction = document.getElementById('ai-instruction');
    var ask = document.getElementById('ai-ask');
    var result = document.getElementById('ai-result');
    var apply = document.getElementById('ai-apply');
    var discard = document.getElementById('ai-discard');
    var pendingOperations = null;
    if (!panel || !window.FGBuilder || !window.FG || !FG.api.aiAssist) return;

    function setResult(text, isError) {
        result.textContent = text;
        result.classList.toggle('error', !!isError);
    }

    function openPanel() { panel.classList.remove('hidden'); instruction.focus(); }
    function closePanel() { panel.classList.add('hidden'); }

    ask.addEventListener('click', async function () {
        var text = instruction.value.trim();
        if (!text) { setResult('Tulis instruksi terlebih dahulu.', true); return; }
        ask.disabled = true;
        apply.disabled = true;
        discard.disabled = true;
        pendingOperations = null;
        setResult('AI sedang membaca workflow…');
        try {
            var response = await FG.api.aiAssist(text, window.FGBuilder.getWorkflow());
            pendingOperations = response.operations;
            setResult((response.summary || 'Preview siap.') + '\n\n' + response.operations.length + ' operasi menunggu persetujuan.');
            apply.disabled = false;
            discard.disabled = false;
        } catch (e) { setResult(e.message || 'AI tidak dapat memproses instruksi.', true); }
        ask.disabled = false;
    });

    apply.addEventListener('click', function () {
        if (!pendingOperations) return;
        if (window.FGBuilder.applyAiOperations(pendingOperations)) {
            setResult('Perubahan diterapkan dan dijadwalkan untuk disimpan.');
            pendingOperations = null;
            apply.disabled = true;
            discard.disabled = true;
        }
    });
    discard.addEventListener('click', function () { pendingOperations = null; setResult('Preview dibuang.'); apply.disabled = true; discard.disabled = true; });
    document.getElementById('btn-ai').addEventListener('click', openPanel);
    document.getElementById('ai-close').addEventListener('click', closePanel);
})();
