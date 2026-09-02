(function () {
    "use strict";

    var panel = document.getElementById('diagram-panel');
    var source = document.getElementById('diagram-source');
    var preview = document.getElementById('diagram-preview');
    var previewStatus = document.getElementById('diagram-preview-status');
    var activeType = 'mermaid';
    var renderTimer = null;

    if (!panel || !source || !preview || !window.FGBuilder) return;

    function setStatus(text) { if (previewStatus) previewStatus.textContent = text; }

    function getDiagram() {
        return window.FGBuilder.getDiagram() || {
            type: 'mermaid',
            source: 'graph TD\n  A[Mulai] --> B[Proses]'
        };
    }

    function renderMarkdown(value) {
        preview.className = 'diagram-preview markdown-preview';
        if (!window.marked || !window.DOMPurify) {
            preview.textContent = value || 'Belum ada Markdown.';
            setStatus('Preview teks');
            return;
        }
        var html = window.marked.parse(value || '*Belum ada Markdown.*', { headerIds: false, mangle: false });
        preview.innerHTML = window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
        setStatus('Preview diperbarui');
    }

    function renderMermaid(value) {
        preview.className = 'diagram-preview mermaid-preview';
        if (!value.trim()) {
            preview.textContent = 'Tulis source Mermaid untuk melihat preview.';
            setStatus('Menunggu source');
            return;
        }
        if (!window.mermaid) {
            preview.textContent = value;
            setStatus('Preview teks');
            return;
        }
        window.mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default'
        });
        var id = 'flowgram-mermaid-' + Date.now();
        window.mermaid.render(id, value).then(function (result) {
            preview.innerHTML = result.svg;
            setStatus('Preview diperbarui');
        }).catch(function () {
            preview.textContent = 'Syntax Mermaid belum valid.';
            setStatus('Periksa syntax');
        });
    }

    function renderPreview() {
        clearTimeout(renderTimer);
        setStatus('Memproses…');
        renderTimer = setTimeout(function () {
            activeType === 'markdown' ? renderMarkdown(source.value) : renderMermaid(source.value);
        }, 180);
    }

    function syncTab(type) {
        activeType = type === 'markdown' ? 'markdown' : 'mermaid';
        document.querySelectorAll('.diagram-tab').forEach(function (tab) {
            var active = tab.dataset.diagramType === activeType;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', String(active));
        });
        renderPreview();
    }

    function openPanel() {
        var diagram = getDiagram();
        activeType = diagram.type === 'markdown' ? 'markdown' : 'mermaid';
        source.value = diagram.source || '';
        panel.classList.remove('hidden');
        syncTab(activeType);
        source.focus();
    }

    function applyDiagram() {
        window.FGBuilder.setDiagram({ type: activeType, source: source.value, updatedAt: new Date().toISOString() });
        setStatus('Tersimpan di workflow');
    }

    document.getElementById('btn-diagram').addEventListener('click', openPanel);
    document.getElementById('diagram-close').addEventListener('click', function () { panel.classList.add('hidden'); });
    document.getElementById('diagram-apply').addEventListener('click', applyDiagram);
    source.addEventListener('input', renderPreview);
    document.querySelectorAll('.diagram-tab').forEach(function (tab) {
        tab.addEventListener('click', function () { syncTab(tab.dataset.diagramType); });
    });
})();
