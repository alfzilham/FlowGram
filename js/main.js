(function () {
    "use strict";

    const THEME_KEY = 'wf_builder_theme';
    const SIDES = ['top', 'right', 'bottom', 'left'];
    const ICON_CATEGORIES = [
        { label: 'Popular', icons: ['zap', 'play', 'circle-play', 'arrow-right-circle', 'database', 'file-text', 'table', 'file', 'mail', 'message-circle', 'bell', 'share-2', 'image', 'camera', 'music', 'video', 'code', 'terminal', 'globe', 'git-branch', 'user', 'users', 'settings', 'sliders', 'star', 'heart', 'clock', 'calendar', 'check-circle', 'flag'] },
        { label: 'AI', icons: ['brain', 'bot', 'sparkles', 'cpu', 'wand-2', 'scan-eye'] },
        { label: 'Brand', icons: ['git-pull-request', 'palette', 'globe', 'link-2', 'hash'] },
        { label: 'Tech', icons: ['monitor', 'smartphone', 'tablet', 'watch', 'hard-drive', 'keyboard', 'mouse', 'wifi'] },
        { label: 'Productivity', icons: ['clipboard-list', 'folder-open', 'pen-tool', 'file-edit', 'search', 'filter', 'refresh-cw', 'download', 'upload', 'trash-2'] },
        { label: 'Business', icons: ['credit-card', 'shopping-cart', 'gift', 'trophy', 'award', 'trending-up', 'bar-chart-3', 'pie-chart'] },
    ];

    const COLORS = [
        { name: 'default', sw: '#D4D4D8', light: { bg: '#FFFFFF', border: '#E4E4E7' }, dark: { bg: '#212126', border: '#3F3F46' } },
        { name: 'red', sw: '#EF4444', light: { bg: '#FEF2F2', border: '#FCA5A5' }, dark: { bg: 'rgba(239,68,68,0.14)', border: 'rgba(248,113,113,0.5)' } },
        { name: 'orange', sw: '#F97316', light: { bg: '#FFF7ED', border: '#FDBA74' }, dark: { bg: 'rgba(249,115,22,0.14)', border: 'rgba(251,146,60,0.5)' } },
        { name: 'yellow', sw: '#EAB308', light: { bg: '#FEFCE8', border: '#FDE047' }, dark: { bg: 'rgba(234,179,8,0.14)', border: 'rgba(250,204,21,0.5)' } },
        { name: 'green', sw: '#22C55E', light: { bg: '#F0FDF4', border: '#86EFAC' }, dark: { bg: 'rgba(34,197,94,0.14)', border: 'rgba(134,239,172,0.5)' } },
        { name: 'blue', sw: '#3B82F6', light: { bg: '#EFF6FF', border: '#93C5FD' }, dark: { bg: 'rgba(59,130,246,0.14)', border: 'rgba(147,197,253,0.5)' } },
        { name: 'purple', sw: '#A855F7', light: { bg: '#FAF5FF', border: '#D8B4FE' }, dark: { bg: 'rgba(168,85,247,0.14)', border: 'rgba(216,180,254,0.5)' } },
        { name: 'pink', sw: '#EC4899', light: { bg: '#FDF2F8', border: '#F9A8D4' }, dark: { bg: 'rgba(236,72,153,0.14)', border: 'rgba(249,168,212,0.5)' } },
    ];

    /* ---------------- state ---------------- */
    let state = { nodes: [], connections: [] };
    let viewport = { panX: 80, panY: 80, zoom: 1 };
    let selectedNodeIds = new Set();
    let currentProjectId = null;
    let multiSelectActive = false;

    /* ---------------- dom refs ---------------- */
    const wrapper = document.getElementById('canvas-wrapper');
    const world = document.getElementById('world');
    const nodesLayer = document.getElementById('nodes-layer');
    const connGroup = document.getElementById('conn-group');
    const tempLine = document.getElementById('temp-line');
    const emptyState = document.getElementById('empty-state');
    const zoomLabel = document.getElementById('zoom-label');
    const fileInput = document.getElementById('file-input');
    const toastEl = document.getElementById('toast');
    const clearModal = document.getElementById('clear-modal');
    const clearBackdrop = document.getElementById('clear-backdrop');
    const clearConfirm = document.getElementById('clear-confirm');
    const clearCancel = document.getElementById('clear-cancel');
    const clearSummary = document.getElementById('clear-summary');
    const btnHome = document.getElementById('btn-home');
    if (btnHome) {
        btnHome.addEventListener('click', () => { window.location.href = 'index.html'; });
    }

    function uid(p) { return p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
    function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

    /* ---------------- theme ---------------- */
    function applyTheme(t) {
        document.documentElement.setAttribute('data-theme', t);
        try { localStorage.setItem(THEME_KEY, t); } catch (e) { }
        renderNodes();
        updateSelectionVisuals();
    }
    function initTheme() {
        let saved = null;
        try { saved = localStorage.getItem(THEME_KEY); } catch (e) { }
        if (!saved) {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            saved = prefersDark ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', saved);
    }
    document.getElementById('btn-theme').addEventListener('click', () => {
        applyTheme(isDark() ? 'light' : 'dark');
    });

    /* ---------------- persistence (project-aware) ---------------- */
    let saveTimer = null;
    function scheduleSave() {
        if (!currentProjectId) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            var data = { nodes: state.nodes, connections: state.connections, viewport: viewport };
            if (FGAuth.isLoggedIn()) {
                FG.api.updateProject(currentProjectId, { data: data }).catch(function () { });
            } else {
                FG.recordProjectSave(currentProjectId, data);
            }
        }, 300);
    }
    function resolveProjectId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // load project synchronously for demo, async for logged-in
    var _pendingLoad = null;

    function loadProject() {
        currentProjectId = resolveProjectId();
        if (!currentProjectId) {
            window.location.href = 'index.html';
            return false;
        }

        if (FGAuth.isLoggedIn()) {
            _pendingLoad = true;
            FG.api.getProject(currentProjectId).then(function (p) {
                var raw = p.data || {};
                state.nodes = raw.nodes || [];
                state.connections = raw.connections || [];
                viewport = raw.viewport || { panX: 80, panY: 80, zoom: 1 };
                _pendingLoad = false;
                render();
                fadeOutLoader();
            }).catch(function () {
                _pendingLoad = false;
                window.location.href = 'index.html';
            });
            return 'pending';
        }

        // Demo mode — localStorage
        var meta = FG.getProject(currentProjectId);
        if (!meta) {
            window.location.href = 'index.html';
            return false;
        }
        var data = FG.getProjectData(currentProjectId) || FG.emptyProjectData();
        state.nodes = data.nodes || [];
        state.connections = data.connections || [];
        viewport = data.viewport || { panX: 80, panY: 80, zoom: 1 };
        return true;
    }

    function fadeOutLoader() {
        setTimeout(function () {
            var overlay = document.getElementById('loader-overlay');
            if (overlay) overlay.classList.add('fade-out');
        }, 300);
    }

    /* ---------------- toast ---------------- */
    let toastTimer = null;
    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
    }

    /* ---------------- node helpers ---------------- */
    function makeNode(x, y, text, color, icon) {
        return { id: uid('n'), x, y, text: text || '', color: color || 'default', icon: icon || null };
    }
    function getNode(id) { return state.nodes.find(n => n.id === id); }
    function colorDef(name) { return COLORS.find(c => c.name === name) || COLORS[0]; }

    function deleteNodes(ids) {
        const idSet = new Set(ids);
        state.nodes = state.nodes.filter(n => !idSet.has(n.id));
        state.connections = state.connections.filter(c => !idSet.has(c.from.nodeId) && !idSet.has(c.to.nodeId));
        ids.forEach(id => selectedNodeIds.delete(id));
    }
    function duplicateNodes(ids) {
        const copies = [];
        ids.forEach(id => {
            const n = getNode(id);
            if (!n) return;
            const copy = makeNode(n.x + 28, n.y + 28, n.text, n.color, n.icon);
            state.nodes.push(copy);
            copies.push(copy);
        });
        return copies;
    }

    /* ---------------- viewport transform ---------------- */
    function applyTransform() {
        world.style.transform = `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`;
        zoomLabel.textContent = Math.round(viewport.zoom * 100) + '%';
    }
    function screenToWorld(clientX, clientY) {
        const r = wrapper.getBoundingClientRect();
        const sx = clientX - r.left;
        const sy = clientY - r.top;
        return { x: (sx - viewport.panX) / viewport.zoom, y: (sy - viewport.panY) / viewport.zoom };
    }

    function clampZoom(z) { return Math.min(2.5, Math.max(0.25, z)); }
    function zoomAt(clientX, clientY, factor) {
        const r = wrapper.getBoundingClientRect();
        const sx = clientX - r.left, sy = clientY - r.top;
        const worldX = (sx - viewport.panX) / viewport.zoom;
        const worldY = (sy - viewport.panY) / viewport.zoom;
        const newZoom = clampZoom(viewport.zoom * factor);
        viewport.panX = sx - worldX * newZoom;
        viewport.panY = sy - worldY * newZoom;
        viewport.zoom = newZoom;
        applyTransform();
        scheduleSave();
    }

    /* ---------------- render ---------------- */
    function render() {
        renderNodes();
        renderConnections();
        applyTransform();
        emptyState.classList.toggle('hidden', state.nodes.length > 0);
    }

    function renderNodes() {
        nodesLayer.innerHTML = '';
        state.nodes.forEach(n => {
            nodesLayer.appendChild(buildNodeEl(n));
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function buildNodeEl(n) {
        const c = colorDef(n.color);
        const theme = isDark() ? c.dark : c.light;
        const el = document.createElement('div');
        el.className = 'node' + (selectedNodeIds.has(n.id) ? ' selected' : '');
        el.style.left = n.x + 'px';
        el.style.top = n.y + 'px';
        el.dataset.id = n.id;

        const body = document.createElement('div');
        body.className = 'node-body';
        body.style.background = theme.bg;
        body.style.borderColor = theme.border;

        const menuBtn = document.createElement('button');

        if (n.icon) {
            const iconEl = document.createElement('i');
            iconEl.setAttribute('data-lucide', n.icon);
            iconEl.className = 'node-icon';
            body.insertBefore(iconEl, body.firstChild);
        }
        menuBtn.className = 'node-menu-btn';
        menuBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>';
        menuBtn.title = 'Opsi';
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleNodeContextTrigger(n.id, e);
            const r = menuBtn.getBoundingClientRect();
            openNodeMenu(n.id, r.right, r.bottom + 4);
        });

        const text = document.createElement('div');
        text.className = 'node-text';
        text.contentEditable = 'false';
        text.textContent = n.text;
        text.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            startEditing(n.id, text);
        });
        let lastTap = 0;
        text.addEventListener('touchend', (e) => {
            if (text.contentEditable === 'true') return;
            const now = Date.now();
            if (now - lastTap < 300 && now - lastTap > 0) {
                e.preventDefault();
                startEditing(n.id, text);
            }
            lastTap = now;
        });
        text.addEventListener('blur', () => finishEditing(n.id, text));
        text.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); text.blur(); }
            if (e.key === 'Escape') { text.textContent = getNode(n.id).text; text.blur(); }
        });

        body.appendChild(menuBtn);
        body.appendChild(text);
        el.appendChild(body);

        SIDES.forEach(side => {
            const dot = document.createElement('div');
            dot.className = 'connector-dot ' + side;
            dot.dataset.nodeId = n.id;
            dot.dataset.side = side;
            dot.addEventListener('mousedown', onConnectorMouseDown);
            dot.addEventListener('touchstart', (e) => {
                if (longPressTimer) clearTimeout(longPressTimer);
                e.stopPropagation();
                onConnectorMouseDown({ target: dot, dataset: dot.dataset, stopPropagation: () => { }, preventDefault: () => { } });
            }, { passive: true });
            el.appendChild(dot);
        });

        body.addEventListener('mousedown', (e) => onNodeMouseDown(e, n.id, text));
        body.addEventListener('touchstart', (e) => {
            if (text.contentEditable === 'true') return;
            if (e.touches.length !== 1) return;
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
            e.stopPropagation();
            closeMenus();
            const t = e.touches[0];
            onNodeMouseDown({ button: 0, shiftKey: false, stopPropagation: () => { }, clientX: t.clientX, clientY: t.clientY }, n.id, text);
        }, { passive: true });
        body.addEventListener('contextmenu', (e) => {
            e.preventDefault(); e.stopPropagation();
            handleNodeContextTrigger(n.id, e);
            openNodeMenu(n.id, e.clientX, e.clientY);
        });

        return el;
    }

    function handleNodeContextTrigger(nodeId, e) {
        if (!(selectedNodeIds.has(nodeId) && selectedNodeIds.size > 1)) {
            selectedNodeIds = new Set([nodeId]);
            updateSelectionVisuals();
        }
    }

    function startEditing(id, textEl) {
        textEl.contentEditable = 'true';
        textEl.focus();
        document.execCommand && document.execCommand('selectAll', false, null);
    }
    function finishEditing(id, textEl) {
        textEl.contentEditable = 'false';
        const n = getNode(id);
        if (n) {
            n.text = textEl.textContent;
            scheduleSave();
        }
    }

    function renderConnections() {
        connGroup.innerHTML = '';
        state.connections.forEach(c => {
            const pathEls = buildConnectionPaths(c);
            if (pathEls) connGroup.appendChild(pathEls);
        });
    }

    function nodeAnchor(node, side, elOverride) {
        const el = elOverride || nodesLayer.querySelector('.node[data-id="' + node.id + '"] .node-body');
        const w = el ? el.offsetWidth : 200;
        const h = el ? el.offsetHeight : 60;
        switch (side) {
            case 'top': return { x: node.x + w / 2, y: node.y };
            case 'bottom': return { x: node.x + w / 2, y: node.y + h };
            case 'left': return { x: node.x, y: node.y + h / 2 };
            case 'right': return { x: node.x + w, y: node.y + h / 2 };
        }
    }

    function bezierD(p1, side1, p2, side2) {
        const dx = Math.abs(p2.x - p1.x), dy = Math.abs(p2.y - p1.y);
        const offH = Math.max(50, dx * 0.5);
        const offV = Math.max(50, dy * 0.5);
        function ctrl(p, side) {
            switch (side) {
                case 'left': return { x: p.x - offH, y: p.y };
                case 'right': return { x: p.x + offH, y: p.y };
                case 'top': return { x: p.x, y: p.y - offV };
                case 'bottom': return { x: p.x, y: p.y + offV };
            }
        }
        const c1 = ctrl(p1, side1), c2 = ctrl(p2, side2);
        return `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
    }

    function buildConnectionPaths(c) {
        const fromNode = getNode(c.from.nodeId);
        const toNode = getNode(c.to.nodeId);
        if (!fromNode || !toNode) return null;
        const p1 = nodeAnchor(fromNode, c.from.side);
        const p2 = nodeAnchor(toNode, c.to.side);
        const d = bezierD(p1, c.from.side, p2, c.to.side);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.dataset.connId = c.id;

        const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hit.setAttribute('d', d);
        hit.setAttribute('class', 'connection-hit');

        const visible = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        visible.setAttribute('d', d);
        visible.setAttribute('class', 'connection-visible');

        hit.addEventListener('mouseenter', () => visible.classList.add('hover'));
        hit.addEventListener('mouseleave', () => visible.classList.remove('hover'));
        hit.addEventListener('contextmenu', (e) => {
            e.preventDefault(); e.stopPropagation();
            openConnectionMenu(c.id, e.clientX, e.clientY);
        });

        g.appendChild(hit);
        g.appendChild(visible);
        return g;
    }

    function refreshConnectionsForNode(nodeId) {
        connGroup.querySelectorAll('g').forEach(g => {
            const c = state.connections.find(cn => cn.id === g.dataset.connId);
            if (!c) return;
            if (c.from.nodeId !== nodeId && c.to.nodeId !== nodeId) return;
            const fromNode = getNode(c.from.nodeId), toNode = getNode(c.to.nodeId);
            if (!fromNode || !toNode) return;
            const p1 = nodeAnchor(fromNode, c.from.side);
            const p2 = nodeAnchor(toNode, c.to.side);
            const d = bezierD(p1, c.from.side, p2, c.to.side);
            g.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
        });
    }

    /* ---------------- selection ---------------- */
    function updateSelectionVisuals() {
        nodesLayer.querySelectorAll('.node').forEach(el => {
            el.classList.toggle('selected', selectedNodeIds.has(el.dataset.id));
        });
    }
    function selectOnly(id) {
        selectedNodeIds = new Set([id]);
        updateSelectionVisuals();
    }
    function toggleSelection(id) {
        if (selectedNodeIds.has(id)) selectedNodeIds.delete(id);
        else selectedNodeIds.add(id);
        updateSelectionVisuals();
    }
    function clearSelection() {
        selectedNodeIds = new Set();
        updateSelectionVisuals();
    }

    /* ---------------- panning & marquee select ---------------- */
    let isPanning = false, panStart = { x: 0, y: 0 }, panOrigin = { x: 0, y: 0 }, panMoved = false;
    let marqueeState = null;

    wrapper.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('.node') || e.target.closest('.connector-dot') || e.target.closest('.connection-hit')) return;
        closeMenus();

        if (e.shiftKey) {
            marqueeState = { start: { x: e.clientX, y: e.clientY } };
            const box = document.createElement('div');
            box.className = 'marquee-box';
            box.style.left = e.clientX + 'px';
            box.style.top = e.clientY + 'px';
            box.style.width = '0px';
            box.style.height = '0px';
            document.body.appendChild(box);
            marqueeState.el = box;
            wrapper.classList.add('marqueeing');
            return;
        }

        isPanning = true; panMoved = false;
        panStart = { x: e.clientX, y: e.clientY };
        panOrigin = { x: viewport.panX, y: viewport.panY };
        wrapper.classList.add('panning');
    });

    function nodeWorldRect(n) {
        const el = nodesLayer.querySelector('.node[data-id="' + n.id + '"] .node-body');
        const w = el ? el.offsetWidth : 200;
        const h = el ? el.offsetHeight : 60;
        return { x1: n.x, y1: n.y, x2: n.x + w, y2: n.y + h };
    }
    function rectsIntersect(a, b) {
        return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
    }

    function updateMarquee(clientX, clientY) {
        const s = marqueeState.start;
        const left = Math.min(s.x, clientX), top = Math.min(s.y, clientY);
        const w = Math.abs(clientX - s.x), h = Math.abs(clientY - s.y);
        marqueeState.el.style.left = left + 'px';
        marqueeState.el.style.top = top + 'px';
        marqueeState.el.style.width = w + 'px';
        marqueeState.el.style.height = h + 'px';

        const wTopLeft = screenToWorld(left, top);
        const wBottomRight = screenToWorld(left + w, top + h);
        const box = { x1: wTopLeft.x, y1: wTopLeft.y, x2: wBottomRight.x, y2: wBottomRight.y };

        const next = new Set();
        state.nodes.forEach(n => {
            if (rectsIntersect(nodeWorldRect(n), box)) next.add(n.id);
        });
        selectedNodeIds = next;
        updateSelectionVisuals();
    }

    /* ---------------- node dragging (supports multi-select) ---------------- */
    let dragState = null;

    function onNodeMouseDown(e, id, textEl) {
        if (e.button !== 0) return;
        if (textEl.contentEditable === 'true') return;
        e.stopPropagation();
        closeMenus();

        if (e.shiftKey || multiSelectActive) {
            toggleSelection(id);
            return;
        }

        if (!(selectedNodeIds.has(id) && selectedNodeIds.size > 1)) {
            selectOnly(id);
        }

        const originWorld = screenToWorld(e.clientX, e.clientY);
        const items = [...selectedNodeIds].map(nid => {
            const n = getNode(nid);
            return { id: nid, startX: n.x, startY: n.y };
        });
        dragState = { origin: originWorld, items, moved: false, clickedId: id };
        items.forEach(it => {
            const el = nodesLayer.querySelector('.node[data-id="' + it.id + '"]');
            if (el) el.classList.add('dragging');
        });
    }

    /* ---------------- connection dragging ---------------- */
    let draggingConn = null;

    function onConnectorMouseDown(e) {
        e.stopPropagation(); e.preventDefault();
        closeMenus();
        const nodeId = e.target.dataset.nodeId;
        const side = e.target.dataset.side;
        draggingConn = { fromNodeId: nodeId, fromSide: side };
        e.target.classList.add('active');
        const n = getNode(nodeId);
        const p1 = nodeAnchor(n, side);
        tempLine.setAttribute('d', `M ${p1.x} ${p1.y} L ${p1.x} ${p1.y}`);
        tempLine.style.display = 'block';
    }

    document.addEventListener('mousemove', (e) => {
        if (marqueeState) {
            updateMarquee(e.clientX, e.clientY);
            return;
        }
        if (isPanning) {
            const dx = e.clientX - panStart.x, dy = e.clientY - panStart.y;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) panMoved = true;
            viewport.panX = panOrigin.x + dx;
            viewport.panY = panOrigin.y + dy;
            applyTransform();
            return;
        }
        if (dragState) {
            dragState.moved = true;
            const w = screenToWorld(e.clientX, e.clientY);
            const dx = w.x - dragState.origin.x, dy = w.y - dragState.origin.y;
            dragState.items.forEach(it => {
                const n = getNode(it.id);
                n.x = it.startX + dx; n.y = it.startY + dy;
                const el = nodesLayer.querySelector('.node[data-id="' + it.id + '"]');
                if (el) { el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; }
                refreshConnectionsForNode(it.id);
            });
            return;
        }
        if (draggingConn) {
            const n = getNode(draggingConn.fromNodeId);
            const p1 = nodeAnchor(n, draggingConn.fromSide);
            const w = screenToWorld(e.clientX, e.clientY);
            tempLine.setAttribute('d', bezierD(p1, draggingConn.fromSide, w, oppositeSide(draggingConn.fromSide)));
        }
    });

    document.addEventListener('touchmove', (e) => {
        if (marqueeState) return;
        const t = e.touches[0];
        if (dragState) {
            dragState.moved = true;
            const w = screenToWorld(t.clientX, t.clientY);
            const dx = w.x - dragState.origin.x, dy = w.y - dragState.origin.y;
            dragState.items.forEach(it => {
                const n = getNode(it.id);
                n.x = it.startX + dx; n.y = it.startY + dy;
                const el = nodesLayer.querySelector('.node[data-id="' + it.id + '"]');
                if (el) { el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; }
                refreshConnectionsForNode(it.id);
            });
        }
        if (draggingConn) {
            const n = getNode(draggingConn.fromNodeId);
            const p1 = nodeAnchor(n, draggingConn.fromSide);
            const w = screenToWorld(t.clientX, t.clientY);
            tempLine.setAttribute('d', bezierD(p1, draggingConn.fromSide, w, oppositeSide(draggingConn.fromSide)));
        }
    }, { passive: true });

    function oppositeSide(side) {
        return { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side];
    }

    document.addEventListener('mouseup', (e) => {
        if (marqueeState) {
            marqueeState.el.remove();
            marqueeState = null;
            wrapper.classList.remove('marqueeing');
        }
        if (isPanning) {
            isPanning = false;
            wrapper.classList.remove('panning');
            if (!panMoved) { clearSelection(); }
            scheduleSave();
        }
        if (dragState) {
            dragState.items.forEach(it => {
                const el = nodesLayer.querySelector('.node[data-id="' + it.id + '"]');
                if (el) el.classList.remove('dragging');
            });
            if (dragState.moved) {
                scheduleSave();
            } else if (dragState.items.length > 1) {
                selectOnly(dragState.clickedId);
            }
            dragState = null;
        }
        if (draggingConn) {
            document.querySelectorAll('.connector-dot.active').forEach(d => d.classList.remove('active'));
            tempLine.style.display = 'none';
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const dot = target ? target.closest('.connector-dot') : null;
            if (dot) {
                const toNodeId = dot.dataset.nodeId, toSide = dot.dataset.side;
                const isSameDot = toNodeId === draggingConn.fromNodeId && toSide === draggingConn.fromSide;
                if (!isSameDot) {
                    state.connections.push({
                        id: uid('c'),
                        from: { nodeId: draggingConn.fromNodeId, side: draggingConn.fromSide },
                        to: { nodeId: toNodeId, side: toSide }
                    });
                    renderConnections();
                    scheduleSave();
                }
            }
            draggingConn = null;
        }
    });

    document.addEventListener('touchend', (e) => {
        if (dragState) {
            dragState.items.forEach(it => {
                const el = nodesLayer.querySelector('.node[data-id="' + it.id + '"]');
                if (el) el.classList.remove('dragging');
            });
            if (dragState.moved) { scheduleSave(); }
            else if (dragState.items.length > 1) { selectOnly(dragState.clickedId); }
            dragState = null;
        }
        if (draggingConn) {
            document.querySelectorAll('.connector-dot.active').forEach(d => d.classList.remove('active'));
            tempLine.style.display = 'none';
            const target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            const dot = target ? target.closest('.connector-dot') : null;
            if (dot) {
                const toNodeId = dot.dataset.nodeId, toSide = dot.dataset.side;
                const isSameDot = toNodeId === draggingConn.fromNodeId && toSide === draggingConn.fromSide;
                if (!isSameDot) {
                    state.connections.push({
                        id: uid('c'),
                        from: { nodeId: draggingConn.fromNodeId, side: draggingConn.fromSide },
                        to: { nodeId: toNodeId, side: toSide }
                    });
                    renderConnections();
                    scheduleSave();
                }
            }
            draggingConn = null;
        }
    }, { passive: true });

    /* ---------------- wheel zoom ---------------- */
    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.09 : 1 / 1.09;
        zoomAt(e.clientX, e.clientY, factor);
    }, { passive: false });

    /* ---------------- touch: pan, pinch zoom, long-press ---------------- */
    let touchState = null;  // { id, startX, startY, originPanX, originPanY, moved }
    let pinchState = null;  // { dist, cx, cy }
    let longPressTimer = null;

    wrapper.addEventListener('touchstart', (e) => {
        if (e.target.closest('.node') || e.target.closest('.connector-dot') || e.target.closest('.connection-hit')) return;
        closeMenus();

        if (e.touches.length === 1) {
            const t = e.touches[0];
            longPressTimer = setTimeout(() => {
                const w = screenToWorld(t.clientX, t.clientY);
                addNodeAt(w.x - 90, w.y - 24);
                longPressTimer = null;
                touchState = null;
            }, 600);
            touchState = { id: t.identifier, startX: t.clientX, startY: t.clientY, originPanX: viewport.panX, originPanY: viewport.panY, moved: false };
        } else if (e.touches.length === 2) {
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
            const t = e.touches;
            pinchState = { dist: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY), cx: (t[0].clientX + t[1].clientX) / 2, cy: (t[0].clientY + t[1].clientY) / 2 };
            touchState = null;
        }
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

        if (pinchState && e.touches.length === 2) {
            const t = e.touches;
            const dist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
            zoomAt(pinchState.cx, pinchState.cy, dist / pinchState.dist);
            pinchState.dist = dist;
            e.preventDefault();
            return;
        }

        if (touchState && e.touches.length === 1) {
            const t = e.touches[0];
            const dx = t.clientX - touchState.startX;
            const dy = t.clientY - touchState.startY;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                touchState.moved = true;
                viewport.panX = touchState.originPanX + dx;
                viewport.panY = touchState.originPanY + dy;
                applyTransform();
            }
        }
    }, { passive: false });

    wrapper.addEventListener('touchend', (e) => {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        if (touchState) {
            if (!touchState.moved) clearSelection();
            scheduleSave();
        }
        touchState = null;
        if (e.touches.length < 2) pinchState = null;
    }, { passive: true });

    /* ---------------- double click empty canvas ---------------- */
    wrapper.addEventListener('dblclick', (e) => {
        if (e.target.closest('.node')) return;
        const w = screenToWorld(e.clientX, e.clientY);
        addNodeAt(w.x - 90, w.y - 24);
    });

    /* ---------------- context menu: canvas ---------------- */
    wrapper.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (e.target.closest('.node') || e.target.closest('.connection-hit')) return;
        const w = screenToWorld(e.clientX, e.clientY);
        openCanvasMenu(w.x - 90, w.y - 24, e.clientX, e.clientY);
    });

    /* ---------------- add node ---------------- */
    function addNodeAt(x, y, text, color) {
        const n = makeNode(x, y, text || 'Node baru', color || 'default');
        state.nodes.push(n);
        render();
        selectOnly(n.id);
        scheduleSave();
        return n;
    }

    document.getElementById('btn-add-node').addEventListener('click', () => {
        const r = wrapper.getBoundingClientRect();
        const w = screenToWorld(r.left + r.width / 2, r.top + r.height / 2);
        addNodeAt(w.x - 90, w.y - 24);
    });

    /* ---------------- toolbar: zoom / view ---------------- */
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        const r = wrapper.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.2);
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        const r = wrapper.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.2);
    });
    document.getElementById('btn-reset-view').addEventListener('click', () => {
        viewport.panX = 80; viewport.panY = 80; viewport.zoom = 1;
        applyTransform(); scheduleSave();
    });

    /* ---------------- export / import ---------------- */
    document.getElementById('btn-export').addEventListener('click', () => {
        const data = { nodes: state.nodes, connections: state.connections };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'workflow-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        showToast('Workflow diexport');
    });

    document.getElementById('btn-import').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!Array.isArray(data.nodes)) throw new Error('invalid');
                state.nodes = data.nodes;
                state.connections = Array.isArray(data.connections) ? data.connections : [];
                clearSelection();
                render();
                scheduleSave();
                showToast('Workflow berhasil diimport');
            } catch (err) {
                showToast('Gagal import: format file tidak valid');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    document.getElementById('btn-clear').addEventListener('click', () => {
        if (state.nodes.length === 0 && state.connections.length === 0) return;
        var nodeCount = state.nodes.length;
        var connCount = state.connections.length;
        clearSummary.textContent = nodeCount + ' node dan ' + connCount + ' koneksi akan dihapus.';
        clearModal.classList.remove('hidden');
    });

    clearConfirm.addEventListener('click', function () {
        state.nodes = []; state.connections = []; clearSelection();
        render(); scheduleSave();
        clearModal.classList.add('hidden');
        showToast('Kanvas dikosongkan');
    });
    clearCancel.addEventListener('click', function () {
        clearModal.classList.add('hidden');
    });
    clearBackdrop.addEventListener('click', function () {
        clearModal.classList.add('hidden');
    });

    document.getElementById('btn-multi-select').addEventListener('click', () => {
        multiSelectActive = !multiSelectActive;
        document.getElementById('btn-multi-select').classList.toggle('active', multiSelectActive);
        showToast(multiSelectActive ? 'Mode multi select aktif' : 'Mode multi select nonaktif');
    });

    /* ---------------- context menus ---------------- */
    let activeMenu = null;
    let iconSubmenu = null;
    let sheetBackdrop = null;

    function isMobile() { return window.innerWidth <= 768; }

    function closeMenus() {
        if (iconSubmenu) { iconSubmenu.remove(); iconSubmenu = null; }
        if (sheetBackdrop) { sheetBackdrop.remove(); sheetBackdrop = null; }
        if (activeMenu) { activeMenu.remove(); activeMenu = null; }
    }
    document.addEventListener('mousedown', (e) => {
        if (activeMenu && iconSubmenu) {
            if (!activeMenu.contains(e.target) && !iconSubmenu.contains(e.target)) closeMenus();
        } else if (activeMenu && !activeMenu.contains(e.target)) {
            closeMenus();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeMenus(); }
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.size > 0) {
            const active = document.activeElement;
            if (active && active.isContentEditable) return;
            const ids = [...selectedNodeIds];
            deleteNodes(ids);
            render(); scheduleSave();
        }
        if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) {
            const active = document.activeElement;
            if (active && active.isContentEditable) return;
            e.preventDefault();
            selectedNodeIds = new Set(state.nodes.map(n => n.id));
            updateSelectionVisuals();
        }
    });

    function positionMenu(el, clientX, clientY) {
        document.body.appendChild(el);
        const vw = window.innerWidth, vh = window.innerHeight;
        const rect = el.getBoundingClientRect();
        let x = clientX, y = clientY;
        if (x + rect.width > vw - 8) x = vw - rect.width - 8;
        if (y + rect.height > vh - 8) y = vh - rect.height - 8;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
    }

    function showAsSheet(menuEl) {
        const backdrop = document.createElement('div');
        backdrop.className = 'sheet-backdrop';
        backdrop.addEventListener('click', closeMenus);
        backdrop.addEventListener('touchstart', closeMenus);
        document.body.appendChild(backdrop);
        sheetBackdrop = backdrop;

        const handle = document.createElement('div');
        handle.className = 'sheet-handle';
        menuEl.insertBefore(handle, menuEl.firstChild);
        menuEl.style.left = '';
        menuEl.style.top = '';
        document.body.appendChild(menuEl);
        activeMenu = menuEl;
    }

    function iconSvg(path) {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
    }

    function openNodeMenu(nodeId, clientX, clientY) {
        closeMenus();
        const multi = selectedNodeIds.has(nodeId) && selectedNodeIds.size > 1;
        const targetIds = multi ? [...selectedNodeIds] : [nodeId];
        const n = getNode(nodeId);
        if (!n) return;

        const menu = document.createElement('div');
        menu.className = 'ctx-menu';

        if (multi) {
            const label = document.createElement('div');
            label.className = 'ctx-label';
            label.textContent = targetIds.length + ' node dipilih';
            menu.appendChild(label);
        } else {
            const editItem = document.createElement('div');
            editItem.className = 'ctx-item';
            editItem.innerHTML = iconSvg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>') + '<span>Edit teks</span>';
            editItem.addEventListener('click', () => {
                closeMenus();
                const el = nodesLayer.querySelector('.node[data-id="' + nodeId + '"] .node-text');
                if (el) startEditing(nodeId, el);
            });
            menu.appendChild(editItem);
        }

        const dupItem = document.createElement('div');
        dupItem.className = 'ctx-item';
        dupItem.innerHTML = iconSvg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>') + '<span>Duplikat ' + (multi ? targetIds.length + ' node' : 'node') + '</span>';
        dupItem.addEventListener('click', () => {
            closeMenus();
            const copies = duplicateNodes(targetIds);
            render();
            selectedNodeIds = new Set(copies.map(c => c.id));
            updateSelectionVisuals();
            scheduleSave();
        });
        menu.appendChild(dupItem);

        const sep1 = document.createElement('div'); sep1.className = 'ctx-sep'; menu.appendChild(sep1);

        const colorLabel = document.createElement('div');
        colorLabel.className = 'ctx-item';
        colorLabel.style.cursor = 'default';
        colorLabel.innerHTML = iconSvg('<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>') + '<span>Ubah warna ' + (multi ? targetIds.length + ' node' : 'node') + '</span>';
        menu.appendChild(colorLabel);

        const colorWrap = document.createElement('div');
        colorWrap.className = 'ctx-colors';
        COLORS.forEach(c => {
            const sw = document.createElement('div');
            sw.className = 'ctx-color-sw' + (!multi && n.color === c.name ? ' selected' : '');
            sw.style.background = c.sw;
            sw.title = c.name;
            sw.addEventListener('click', () => {
                targetIds.forEach(id => {
                    const tn = getNode(id);
                    if (tn) tn.color = c.name;
                });
                renderNodes();
                updateSelectionVisuals();
                closeMenus();
                scheduleSave();
            });
            colorWrap.appendChild(sw);
        });
        menu.appendChild(colorWrap);

        const sepIcon = document.createElement('div'); sepIcon.className = 'ctx-sep'; menu.appendChild(sepIcon);

        if (!multi) {
            const iconItem = document.createElement('div');
            iconItem.className = 'ctx-item';
            iconItem.innerHTML = iconSvg('<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><circle cx="12" cy="16" r=".5" fill="currentColor"/>') + '<span>Icon node</span><span class="ctx-arrow">▶</span>';
            iconItem.addEventListener('click', (e) => {
                e.stopPropagation();
                openIconSubmenu(nodeId, menu, e.clientX, e.clientY);
            });
            iconItem.addEventListener('mouseenter', () => {
                if (iconSubmenu) return;
                const r = menu.getBoundingClientRect();
                openIconSubmenu(nodeId, menu, r.right - 4, r.top + iconItem.offsetTop);
            });
            menu.appendChild(iconItem);
        }

        const sep2 = document.createElement('div'); sep2.className = 'ctx-sep'; menu.appendChild(sep2);

        const delItem = document.createElement('div');
        delItem.className = 'ctx-item danger';
        delItem.innerHTML = iconSvg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>') + '<span>Hapus ' + (multi ? targetIds.length + ' node' : 'node') + '</span>';
        delItem.addEventListener('click', () => {
            closeMenus();
            deleteNodes(targetIds);
            render();
            scheduleSave();
        });
        menu.appendChild(delItem);

        if (isMobile()) {
            showAsSheet(menu);
        } else {
            positionMenu(menu, clientX, clientY);
            activeMenu = menu;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons({ scope: menu });
    }

    function openIconSubmenu(nodeId, parentMenu, clientX, clientY) {
        if (iconSubmenu) { iconSubmenu.remove(); iconSubmenu = null; }
        const n = getNode(nodeId);
        if (!n) return;

        const menu = document.createElement('div');
        menu.className = 'ctx-menu ctx-icon-submenu';

        if (isMobile()) {
            const backItem = document.createElement('div');
            backItem.className = 'ctx-item';
            backItem.innerHTML = iconSvg('<path d="M19 12H5M12 19l-7-7 7-7"/>') + '<span>Kembali</span>';
            backItem.addEventListener('click', closeMenus);
            menu.appendChild(backItem);
            const sep = document.createElement('div'); sep.className = 'ctx-sep'; menu.appendChild(sep);
        }

        ICON_CATEGORIES.forEach(cat => {
            const label = document.createElement('div');
            label.className = 'ctx-icon-category-label';
            label.textContent = cat.label;
            menu.appendChild(label);

            const wrap = document.createElement('div');
            wrap.className = 'ctx-icons';
            cat.icons.forEach(name => {
                const cell = document.createElement('div');
                cell.className = 'ctx-icon-cell' + (n.icon === name ? ' selected' : '');
                cell.innerHTML = '<i data-lucide="' + name + '"></i>';
                cell.title = name;
                cell.addEventListener('click', () => {
                    n.icon = name;
                    renderNodes();
                    updateSelectionVisuals();
                    closeMenus();
                    scheduleSave();
                });
                wrap.appendChild(cell);
            });
            menu.appendChild(wrap);
        });

        if (n.icon) {
            const sep = document.createElement('div'); sep.className = 'ctx-sep'; menu.appendChild(sep);
            const removeItem = document.createElement('div');
            removeItem.className = 'ctx-item';
            removeItem.innerHTML = iconSvg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>') + '<span>Hapus icon</span>';
            removeItem.addEventListener('click', () => {
                closeMenus();
                n.icon = null;
                renderNodes();
                updateSelectionVisuals();
                scheduleSave();
            });
            menu.appendChild(removeItem);
        }

        document.body.appendChild(menu);
        if (isMobile()) {
            activeMenu = menu;
        } else {
            const rect = menu.getBoundingClientRect();
            let x = clientX, y = clientY;
            const vw = window.innerWidth, vh = window.innerHeight;
            if (x + rect.width > vw - 8) x = parentMenu.getBoundingClientRect().left - rect.width + 4;
            if (y + rect.height > vh - 8) y = vh - rect.height - 8;
            menu.style.left = x + 'px';
            menu.style.top = y + 'px';
        }
        iconSubmenu = menu;
        if (typeof lucide !== 'undefined') lucide.createIcons({ scope: menu });
    }

    function openConnectionMenu(connId, clientX, clientY) {
        closeMenus();
        const menu = document.createElement('div');
        menu.className = 'ctx-menu';
        menu.style.minWidth = '170px';
        const delItem = document.createElement('div');
        delItem.className = 'ctx-item danger';
        delItem.innerHTML = iconSvg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>') + '<span>Hapus koneksi</span>';
        delItem.addEventListener('click', () => {
            closeMenus();
            state.connections = state.connections.filter(c => c.id !== connId);
            renderConnections();
            scheduleSave();
        });
        menu.appendChild(delItem);
        if (isMobile()) { showAsSheet(menu); }
        else { positionMenu(menu, clientX, clientY); activeMenu = menu; }
    }

    function openCanvasMenu(worldX, worldY, clientX, clientY) {
        closeMenus();
        const menu = document.createElement('div');
        menu.className = 'ctx-menu';
        menu.style.minWidth = '190px';
        const addItem = document.createElement('div');
        addItem.className = 'ctx-item';
        addItem.innerHTML = iconSvg('<path d="M12 5v14M5 12h14"/>') + '<span>Tambah node di sini</span>';
        addItem.addEventListener('click', () => {
            closeMenus();
            addNodeAt(worldX, worldY);
        });
        menu.appendChild(addItem);
        if (isMobile()) { showAsSheet(menu); }
        else { positionMenu(menu, clientX, clientY); activeMenu = menu; }
    }

    /* ---------------- mobile: more sheet ---------------- */
    function openMoreSheet() {
        closeMenus();
        const menu = document.createElement('div');
        menu.className = 'ctx-menu';
        menu.style.minWidth = '200px';

        const exportItem = document.createElement('div');
        exportItem.className = 'ctx-item';
        exportItem.innerHTML = iconSvg('<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>') + '<span>Export JSON</span>';
        exportItem.addEventListener('click', () => { closeMenus(); document.getElementById('btn-export').click(); });
        menu.appendChild(exportItem);

        const importItem = document.createElement('div');
        importItem.className = 'ctx-item';
        importItem.innerHTML = iconSvg('<path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M5 3h14"/>') + '<span>Import JSON</span>';
        importItem.addEventListener('click', () => { closeMenus(); document.getElementById('btn-import').click(); });
        menu.appendChild(importItem);

        const sep1 = document.createElement('div'); sep1.className = 'ctx-sep'; menu.appendChild(sep1);

        const themeItem = document.createElement('div');
        themeItem.className = 'ctx-item';
        themeItem.innerHTML = iconSvg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>') + '<span>Tema ' + (isDark() ? 'Terang' : 'Gelap') + '</span>';
        themeItem.addEventListener('click', () => { closeMenus(); document.getElementById('btn-theme').click(); });
        menu.appendChild(themeItem);

        const sep2 = document.createElement('div'); sep2.className = 'ctx-sep'; menu.appendChild(sep2);

        const clearItem = document.createElement('div');
        clearItem.className = 'ctx-item danger';
        clearItem.innerHTML = iconSvg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>') + '<span>Hapus semua</span>';
        clearItem.addEventListener('click', () => { closeMenus(); document.getElementById('btn-clear').click(); });
        menu.appendChild(clearItem);

        showAsSheet(menu);
    }

    document.getElementById('btn-more').addEventListener('click', openMoreSheet);

    /* ---------------- hamburger (mobile) ---------------- */
    const sidebar = document.getElementById('sidebar');
    const mainEl = document.getElementById('main');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    function openSidebar() {
        if (!sidebar || !mainEl || !sidebarOverlay) return;
        sidebar.classList.add('open');
        mainEl.classList.add('pushed');
        sidebarOverlay.classList.add('visible');
    }

    function closeSidebar() {
        if (!sidebar || !mainEl || !sidebarOverlay) return;
        sidebar.classList.remove('open');
        mainEl.classList.remove('pushed');
        sidebarOverlay.classList.remove('visible');
    }

    const btnHamburger = document.getElementById('btn-hamburger');
    if (btnHamburger) {
        btnHamburger.addEventListener('click', () => {
            sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Tutup sidebar saat filter dipilih di mobile
    if (sidebar) {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.innerWidth <= 768) closeSidebar();
            });
        });
    }

    /* ---------------- init ---------------- */
    initTheme();
    FG.migrateLegacyIfNeeded();

    var authStatus = FGAuth.init();

    function builderStart() {
        var result = loadProject();
        if (result === 'pending') {
            // async — wait for fg-auth-ready (already dispatched) or pending resolve
        } else if (result === true) {
            render();
            fadeOutLoader();
        }
    }

    if (authStatus === 'needs_login') {
        window.addEventListener('fg-auth-ready', builderStart);
    } else if (authStatus === 'validating') {
        window.addEventListener('fg-auth-ready', builderStart);
    } else {
        // demo
        builderStart();
    }

    // Also handle if user was already logged in
    if (authStatus !== 'needs_login' && authStatus !== 'validating') {
        // Already handled by builderStart above
    }

})();
