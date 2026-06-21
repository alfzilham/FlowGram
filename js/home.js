(function () {
    "use strict";

    const THEME_KEY = 'wf_builder_theme';

    /* ---------------- state ---------------- */
    let currentFilter = 'all';      // 'all' | 'archived' | folder id
    let searchQuery = '';

    /* ---------------- dom refs ---------------- */
    const projectsGrid = document.getElementById('projects-grid');
    const emptyHome = document.getElementById('empty-home');
    const foldersList = document.getElementById('folders-list');
    const contentTitle = document.getElementById('content-title');
    const searchInput = document.getElementById('search-input');
    const ctxMenu = document.getElementById('ctx-menu');
    const toastEl = document.getElementById('toast');
    const renameModal = document.getElementById('rename-modal');
    const renameInput = document.getElementById('rename-input');
    const renameTitle = document.getElementById('rename-title');
    const renameConfirm = document.getElementById('rename-confirm');
    const renameCancel = document.getElementById('rename-cancel');
    const renameBd = document.getElementById('rename-backdrop');

    /* ---------------- theme ---------------- */
    function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

    function applyTheme(t) {
        document.documentElement.setAttribute('data-theme', t);
        try { localStorage.setItem(THEME_KEY, t); } catch (e) { }
    }

    function initTheme() {
        let saved = null;
        try { saved = localStorage.getItem(THEME_KEY); } catch (e) { }
        if (!saved) {
            saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', saved);
    }

    document.getElementById('btn-theme-home').addEventListener('click', () => {
        applyTheme(isDark() ? 'light' : 'dark');
    });

    /* ---------------- toast ---------------- */
    let toastTimer = null;
    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
    }

    /* ---------------- helpers ---------------- */
    function formatDate(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const diff = now - d;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Baru saja';
        if (mins < 60) return mins + ' menit lalu';
        const hours = Math.floor(mins / 60);
        if (hours < 24) return hours + ' jam lalu';
        const days = Math.floor(hours / 24);
        if (days < 7) return days + ' hari lalu';
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function iconSvg(path) {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
    }

    /* ---------------- context menu ---------------- */
    let ctxVisible = false;

    function closeCtxMenu() {
        if (!ctxVisible) return;
        ctxMenu.classList.add('hidden');
        ctxMenu.innerHTML = '';
        ctxVisible = false;
    }

    function openCtxMenu(items, clientX, clientY) {
        closeCtxMenu();
        ctxMenu.innerHTML = '';

        items.forEach(item => {
            if (item === 'sep') {
                const sep = document.createElement('div');
                sep.className = 'ctx-menu-sep';
                ctxMenu.appendChild(sep);
                return;
            }
            const btn = document.createElement('button');
            btn.className = 'ctx-menu-item' + (item.danger ? ' danger' : '');
            btn.innerHTML = item.icon + '<span>' + item.label + '</span>';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeCtxMenu();
                item.action();
            });
            ctxMenu.appendChild(btn);
        });

        ctxMenu.classList.remove('hidden');
        ctxVisible = true;

        // Posisi
        const vw = window.innerWidth, vh = window.innerHeight;
        ctxMenu.style.left = '0px';
        ctxMenu.style.top = '0px';
        const rect = ctxMenu.getBoundingClientRect();
        let x = clientX, y = clientY;
        if (x + rect.width > vw - 8) x = vw - rect.width - 8;
        if (y + rect.height > vh - 8) y = vh - rect.height - 8;
        ctxMenu.style.left = x + 'px';
        ctxMenu.style.top = y + 'px';
    }

    document.addEventListener('mousedown', (e) => {
        if (ctxVisible && !ctxMenu.contains(e.target)) closeCtxMenu();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeCtxMenu(); closeRenameModal(); closeDeleteModal(); }
    });

    /* ---------------- delete modal ---------------- */
    const deleteModal = document.getElementById('delete-modal');
    const deleteTitle = document.getElementById('delete-title');
    const deleteDesc = document.getElementById('delete-desc');
    const deleteConfirm = document.getElementById('delete-confirm');
    const deleteCancel = document.getElementById('delete-cancel');
    const deleteBd = document.getElementById('delete-backdrop');
    let deleteCb = null;

    function openDeleteModal(title, desc, cb) {
        deleteTitle.textContent = title;
        deleteDesc.textContent = desc;
        deleteCb = cb;
        deleteModal.classList.remove('hidden');
    }

    function closeDeleteModal() {
        deleteModal.classList.add('hidden');
        deleteCb = null;
    }

    deleteConfirm.addEventListener('click', () => {
        if (deleteCb) deleteCb();
        closeDeleteModal();
    });
    deleteCancel.addEventListener('click', closeDeleteModal);
    deleteBd.addEventListener('click', closeDeleteModal);

    /* ---------------- rename modal ---------------- */
    let renameCb = null;

    function openRenameModal(title, currentVal, cb) {
        renameTitle.textContent = title;
        renameInput.value = currentVal || '';
        renameCb = cb;
        renameModal.classList.remove('hidden');
        setTimeout(() => {
            renameInput.focus();
            renameInput.select();
        }, 50);
    }

    function closeRenameModal() {
        renameModal.classList.add('hidden');
        renameCb = null;
    }

    function confirmRename() {
        const val = renameInput.value.trim();
        if (!val) return;
        if (renameCb) renameCb(val);
        closeRenameModal();
    }

    renameConfirm.addEventListener('click', confirmRename);
    renameCancel.addEventListener('click', closeRenameModal);
    renameBd.addEventListener('click', closeRenameModal);
    renameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmRename();
        if (e.key === 'Escape') closeRenameModal();
    });

    /* ---------------- project card actions ---------------- */
    function buildCardMenuItems(meta) {
        const folders = FG.getFolders();
        return [
            {
                icon: iconSvg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
                label: 'Rename',
                action: () => {
                    openRenameModal('Rename Project', meta.name, (newName) => {
                        FG.renameProject(meta.id, newName);
                        renderAll();
                        showToast('Project direname');
                    });
                }
            },
            {
                icon: iconSvg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
                label: 'Duplikat',
                action: () => {
                    FG.duplicateProject(meta.id);
                    renderAll();
                    showToast('Project diduplikat');
                }
            },
            ...(folders.length > 0 ? [{
                icon: iconSvg('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
                label: meta.folderId ? 'Pindah / Keluarkan dari Folder' : 'Pindah ke Folder',
                action: () => openMoveToFolderMenu(meta)
            }] : []),
            'sep',
            {
                icon: iconSvg('<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>'),
                label: meta.archived ? 'Batalkan Arsip' : 'Arsipkan',
                action: () => {
                    const wasArchived = meta.archived;
                    FG.setArchived(meta.id, !meta.archived);
                    renderAll();
                    showToast(wasArchived ? 'Arsip dibatalkan' : 'Project diarsipkan');
                }
            },
            'sep',
            {
                icon: iconSvg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>'),
                label: 'Hapus',
                danger: true,
                action: () => {
                    openDeleteModal(
                        'Hapus Project',
                        'Hapus "' + meta.name + '"? Tindakan ini tidak bisa dibatalkan.',
                        () => {
                            FG.deleteProject(meta.id);
                            renderAll();
                            showToast('Project dihapus');
                        }
                    );
                }
            }
        ];
    }

    function openMoveToFolderMenu(meta) {
        const folders = FG.getFolders();
        const items = [];

        if (meta.folderId) {
            items.push({
                icon: iconSvg('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
                label: 'Keluarkan dari folder',
                action: () => {
                    FG.moveToFolder(meta.id, null);
                    renderAll();
                    showToast('Project dikeluarkan dari folder');
                }
            });
            items.push('sep');
        }

        folders.forEach(f => {
            if (f.id === meta.folderId) return;
            items.push({
                icon: iconSvg('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
                label: f.name,
                action: () => {
                    FG.moveToFolder(meta.id, f.id);
                    renderAll();
                    showToast('Project dipindah ke ' + f.name);
                }
            });
        });

        openCtxMenu(items, parseInt(ctxMenu.style.left) || 200, parseInt(ctxMenu.style.top) || 200);
    }

    /* ---------------- render project card ---------------- */
    function buildCard(meta) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.id = meta.id;

        // Thumbnail
        const thumb = document.createElement('div');
        thumb.className = 'card-thumb';

        const thumbIcon = document.createElement('div');
        thumbIcon.className = 'card-thumb-icon';
        thumbIcon.innerHTML = iconSvg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>');
        thumb.appendChild(thumbIcon);

        const thumbCount = document.createElement('div');
        thumbCount.className = 'card-thumb-count';
        thumbCount.textContent = (meta.nodeCount || 0) + ' node';
        thumb.appendChild(thumbCount);

        if (meta.archived) {
            const badge = document.createElement('div');
            badge.className = 'card-archived-badge';
            badge.textContent = 'Arsip';
            thumb.appendChild(badge);
        }

        card.appendChild(thumb);

        // Body
        const body = document.createElement('div');
        body.className = 'card-body';

        const info = document.createElement('div');
        info.className = 'card-info';

        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = meta.name;
        info.appendChild(name);

        const date = document.createElement('div');
        date.className = 'card-date';
        date.textContent = formatDate(meta.updatedAt);
        info.appendChild(date);

        body.appendChild(info);

        const menuBtn = document.createElement('button');
        menuBtn.className = 'card-menu-btn';
        menuBtn.title = 'Opsi';
        menuBtn.innerHTML = iconSvg('<circle cx="12" cy="5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/>');
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const r = menuBtn.getBoundingClientRect();
            openCtxMenu(buildCardMenuItems(meta), r.right, r.bottom + 4);
        });
        body.appendChild(menuBtn);

        card.appendChild(body);

        // Click → open builder
        card.addEventListener('click', () => {
            window.location.href = 'builder.html?id=' + meta.id;
        });

        // Right click → context menu
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            openCtxMenu(buildCardMenuItems(meta), e.clientX, e.clientY);
        });

        return card;
    }

    /* ---------------- render projects grid ---------------- */
    function getFilteredProjects() {
        let list = FG.getIndex();

        if (currentFilter === 'archived') {
            list = list.filter(p => p.archived);
        } else if (currentFilter === 'all') {
            list = list.filter(p => !p.archived);
        } else {
            // folder id
            list = list.filter(p => !p.archived && p.folderId === currentFilter);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q));
        }

        return list;
    }

    function renderProjects() {
        projectsGrid.innerHTML = '';
        const list = getFilteredProjects();

        if (list.length === 0) {
            emptyHome.classList.remove('hidden');
            projectsGrid.classList.add('hidden');
        } else {
            emptyHome.classList.add('hidden');
            projectsGrid.classList.remove('hidden');
            list.forEach(meta => {
                projectsGrid.appendChild(buildCard(meta));
            });
        }
    }

    /* ---------------- render folders sidebar ---------------- */
    function renderFolders() {
        foldersList.innerHTML = '';
        const folders = FG.getFolders();
        folders.forEach(f => {
            const btn = document.createElement('button');
            btn.className = 'folder-item' + (currentFilter === f.id ? ' active' : '');
            btn.dataset.folderId = f.id;
            btn.innerHTML = iconSvg('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>') +
                '<span class="folder-item-name">' + f.name + '</span>';

            btn.addEventListener('click', () => setFilter(f.id, f.name));
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                openCtxMenu([
                    {
                        icon: iconSvg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
                        label: 'Rename Folder',
                        action: () => {
                            openRenameModal('Rename Folder', f.name, (newName) => {
                                FG.renameFolder(f.id, newName);
                                renderAll();
                                showToast('Folder direname');
                            });
                        }
                    },
                    'sep',
                    {
                        icon: iconSvg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>'),
                        label: 'Hapus Folder',
                        danger: true,
                        action: () => {
                            openDeleteModal(
                                'Hapus Folder',
                                'Hapus folder "' + f.name + '"? Project di dalamnya tidak akan ikut terhapus.',
                                () => {
                                    if (currentFilter === f.id) setFilter('all', 'Semua Project');
                                    FG.deleteFolder(f.id);
                                    renderAll();
                                    showToast('Folder dihapus');
                                }
                            );
                        }
                    }
                ], e.clientX, e.clientY);
            });

            foldersList.appendChild(btn);
        });
    }

    /* ---------------- render all ---------------- */
    function renderAll() {
        renderFolders();
        renderProjects();
    }

    /* ---------------- filter ---------------- */
    function setFilter(filter, title) {
        currentFilter = filter;
        contentTitle.textContent = title;

        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.filter === filter);
        });
        document.querySelectorAll('.folder-item').forEach(el => {
            el.classList.toggle('active', el.dataset.folderId === filter);
        });

        renderProjects();
    }

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            const title = filter === 'all' ? 'Semua Project' : 'Diarsipkan';
            setFilter(filter, title);
        });
    });

    /* ---------------- search ---------------- */
    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim();
        renderProjects();
    });

    /* ---------------- new project ---------------- */
    document.getElementById('btn-new-project').addEventListener('click', async () => {
        const folderId = (currentFilter !== 'all' && currentFilter !== 'archived') ? currentFilter : null;
        var meta;
        if (FGAuth.isLoggedIn()) {
            meta = await FG.api.createProject({ name: 'Untitled Project', folderId: folderId || null });
        } else {
            meta = FG.createProject({ name: 'Untitled Project', folderId });
        }
        window.location.href = 'builder.html?id=' + meta.id;
    });

    /* ---------------- new folder ---------------- */
    document.getElementById('btn-new-folder').addEventListener('click', async () => {
        const wrap = document.createElement('div');
        wrap.className = 'folder-input-wrap';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'folder-inline-input';
        input.placeholder = 'Nama folder…';
        wrap.appendChild(input);

        foldersList.insertBefore(wrap, foldersList.firstChild);
        input.focus();

        async function confirm() {
            const name = input.value.trim();
            wrap.remove();
            if (name) {
                if (FGAuth.isLoggedIn()) {
                    await FG.api.createFolder(name);
                } else {
                    FG.createFolder(name);
                }
                renderFolders();
                showToast('Folder dibuat');
            }
        }

        input.addEventListener('blur', confirm);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { input.blur(); }
            if (e.key === 'Escape') { wrap.remove(); }
        });
    });

    /* ---------------- user avatar / logout ---------------- */
    const avatarEl = document.getElementById('user-avatar');
    const dropdown = document.getElementById('user-dropdown');
    const avatarImg = document.getElementById('avatar-img');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    const dropdownEmail = document.getElementById('dropdown-email');
    const btnLogout = document.getElementById('btn-logout');

    function showAvatar(user) {
        if (!avatarEl) return;
        avatarEl.style.display = 'block';
        if (user.name) {
            avatarPlaceholder.textContent = user.name.charAt(0).toUpperCase();
        }
        if (user.avatarUrl) {
            avatarImg.src = user.avatarUrl;
            avatarImg.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
        } else {
            avatarImg.style.display = 'none';
            avatarPlaceholder.style.display = 'flex';
        }
        if (dropdownEmail) {
            dropdownEmail.textContent = user.email || 'Demo';
        }
    }

    if (avatarEl) {
        avatarEl.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdown.classList.toggle('visible');
        });
        document.addEventListener('click', function () {
            if (dropdown) dropdown.classList.remove('visible');
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', function () {
            FGAuth.logout();
        });
    }

    /* ---------------- Sidebar Profile ---------------- */
    var profileName = document.getElementById('profile-name');
    var profileEmail = document.getElementById('profile-email');
    var profileAvatarImg = document.getElementById('profile-avatar-img');
    var profileAvatarPlaceholder = document.getElementById('profile-avatar-placeholder');
    var profileMenuBtn = document.getElementById('profile-menu-btn');
    var profileDropdown = document.getElementById('profile-dropdown');
    var profileSettingsAction = document.getElementById('profile-action-settings');
    var profileAuthAction = document.getElementById('profile-action-auth');

    function renderProfile(user) {
        if (!profileName) return;

        if (!user || FGAuth.isDemo()) {
            profileName.textContent = 'Guest';
            profileEmail.textContent = '—';
            profileAvatarImg.style.display = 'none';
            profileAvatarPlaceholder.style.display = 'flex';
            profileAvatarPlaceholder.textContent = '?';
            if (profileSettingsAction) profileSettingsAction.classList.add('hidden');
            if (profileAuthAction) {
                profileAuthAction.textContent = 'Sign in here';
                profileAuthAction.className = 'profile-dropdown-item';
            }
            return;
        }

        profileName.textContent = user.name || 'User';
        profileEmail.textContent = user.email || '—';

        if (user.avatarUrl) {
            profileAvatarImg.src = user.avatarUrl;
            profileAvatarImg.style.display = 'block';
            profileAvatarPlaceholder.style.display = 'none';
        } else {
            profileAvatarImg.style.display = 'none';
            profileAvatarPlaceholder.style.display = 'flex';
            profileAvatarPlaceholder.textContent = (user.name || '?').charAt(0).toUpperCase();
        }

        if (profileSettingsAction) profileSettingsAction.classList.remove('hidden');
        if (profileAuthAction) {
            profileAuthAction.textContent = 'Keluar';
            profileAuthAction.className = 'profile-dropdown-item danger';
        }
    }

    if (profileMenuBtn) {
        profileMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('visible');
        });
    }
    document.addEventListener('click', function () {
        if (profileDropdown) profileDropdown.classList.remove('visible');
    });

    /* ---------------- Settings Modal ---------------- */
    var settingsModal = document.getElementById('settings-modal');
    var settingsClose = document.getElementById('settings-close');
    var settingsNavItems = document.querySelectorAll('.settings-nav-item');
    var settingsTabs = document.querySelectorAll('.settings-tab');
    var settingsNameInput = document.getElementById('settings-name-input');
    var settingsNameSave = document.getElementById('settings-name-save');
    var settingsNameStatus = document.getElementById('settings-name-status');
    var settingsEmail = document.getElementById('settings-email');
    var settingsExportBtn = document.getElementById('settings-export-btn');
    var settingsDeleteBtn = document.getElementById('settings-delete-btn');
    var settingsAvatar = document.getElementById('settings-avatar');
    var settingsAppearance = document.getElementById('settings-appearance');

    function openSettings() {
        if (!settingsModal) return;
        if (FGAuth.isDemo()) {
            showToast('Masuk untuk mengakses Pengaturan');
            return;
        }
        var user = fetchUserFromStorage();
        if (settingsNameInput && user) settingsNameInput.value = user.name || '';
        if (settingsNameStatus) settingsNameStatus.textContent = '';
        if (settingsEmail && user) settingsEmail.textContent = user.email || '—';
        if (settingsAvatar && user) settingsAvatar.textContent = (user.name || '?').charAt(0).toUpperCase();
        settingsModal.classList.remove('hidden');
    }

    function closeSettings() {
        if (settingsModal) settingsModal.classList.add('hidden');
    }

    if (settingsClose) settingsClose.addEventListener('click', closeSettings);
    if (settingsModal) {
        settingsModal.addEventListener('click', function (e) {
            if (e.target === settingsModal || e.target.id === 'settings-backdrop') closeSettings();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) closeSettings();
        });
    }

    // FAQ accordion
    document.querySelectorAll('.settings-faq-q').forEach(function (q) {
        q.addEventListener('click', function () {
            var wrapper = this.nextElementSibling;
            var icon = this.querySelector('.settings-faq-icon');
            wrapper.classList.toggle('open');
            if (icon) icon.classList.toggle('open');
        });
    });

    // Tab switching
    settingsNavItems.forEach(function (item) {
        item.addEventListener('click', function () {
            settingsNavItems.forEach(function (el) { el.classList.remove('active'); });
            item.classList.add('active');
            settingsTabs.forEach(function (tab) { tab.classList.remove('active'); });
            var target = document.getElementById('tab-' + item.dataset.tab);
            if (target) target.classList.add('active');
        });
    });

    // Appearance toggle
    if (settingsAppearance) {
        settingsAppearance.querySelectorAll('.settings-appearance-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                settingsAppearance.querySelectorAll('.settings-appearance-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var theme = btn.dataset.theme;
                if (theme === 'system') {
                    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                } else {
                    document.documentElement.setAttribute('data-theme', theme);
                }
                try { localStorage.setItem('wf_builder_theme', document.documentElement.getAttribute('data-theme')); } catch (e) { }
            });
        });
        // Sync active state with current theme
        var currentTheme = document.documentElement.getAttribute('data-theme');
        settingsAppearance.querySelectorAll('.settings-appearance-btn').forEach(function (btn) {
            if (btn.dataset.theme === currentTheme) btn.classList.add('active');
            // If system, check if it matches
            if (btn.dataset.theme === 'system' && !currentTheme) btn.classList.add('active');
        });
    }

    // Font picker
    var fontTrigger = document.getElementById('settings-font-trigger');
    var fontDropdown = document.getElementById('settings-font-dropdown');
    var fontLabel = document.getElementById('settings-font-label');
    var fontPreview = document.getElementById('settings-font-preview');
    var fontOptions = document.querySelectorAll('.settings-font-option');
    var FONT_KEY = 'fg_font';

    var fontToFamily = {
        'system': '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Inter, Roboto, Helvetica, Arial, sans-serif',
        'Inter': '\'Inter\', sans-serif',
        'Lato': '\'Lato\', sans-serif',
        'Montserrat': '\'Montserrat\', sans-serif',
        'Plus Jakarta Sans': '\'Plus Jakarta Sans\', sans-serif',
        'Poppins': '\'Poppins\', sans-serif',
        'Space Grotesk': '\'Space Grotesk\', sans-serif',
        'JetBrains Mono': '\'JetBrains Mono\', monospace',
        'Arial': 'Arial, sans-serif'
    };

    function applyFont(fontName) {
        var family = fontToFamily[fontName] || fontToFamily['system'];
        document.documentElement.style.setProperty('--font-family', family);
        if (fontLabel) fontLabel.textContent = fontName === 'system' ? 'System Default' : fontName;
        if (fontPreview) fontPreview.style.fontFamily = family;
        fontOptions.forEach(function (opt) { opt.classList.toggle('active', opt.dataset.font === fontName); });
        try { localStorage.setItem(FONT_KEY, fontName); } catch (e) { }
    }

    function initFont() {
        var saved = null;
        try { saved = localStorage.getItem(FONT_KEY); } catch (e) { }
        applyFont(saved || 'system');
    }

    if (fontTrigger && fontDropdown) {
        fontTrigger.addEventListener('click', function (e) {
            e.stopPropagation();
            fontDropdown.classList.toggle('visible');
        });
        document.addEventListener('click', function () {
            if (fontDropdown) fontDropdown.classList.remove('visible');
        });
    }

    fontOptions.forEach(function (opt) {
        opt.addEventListener('click', function () {
            fontDropdown.classList.remove('visible');
            applyFont(opt.dataset.font);
        });
    });

    // Init font on page load
    initFont();

    // Save name
    if (settingsNameSave && settingsNameInput) {
        settingsNameSave.addEventListener('click', async function () {
            var name = settingsNameInput.value.trim();
            if (!name) { settingsNameStatus.textContent = 'Nama tidak boleh kosong'; settingsNameStatus.className = 'settings-status error'; return; }
            settingsNameSave.disabled = true;
            settingsNameSave.textContent = 'Menyimpan...';
            try {
                var res = await fetch('/api/auth/name', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + FGAuth.getToken() },
                    body: JSON.stringify({ name: name })
                });
                var data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Gagal');
                var u = fetchUserFromStorage();
                if (u) { u.name = name; try { localStorage.setItem('fg_user', JSON.stringify(u)); } catch (e) {} }
                renderProfile(u);
                showAvatar(u);
                if (settingsAvatar) settingsAvatar.textContent = name.charAt(0).toUpperCase();
                settingsNameStatus.textContent = 'Nama berhasil disimpan';
                settingsNameStatus.className = 'settings-status';
            } catch (e) {
                settingsNameStatus.textContent = e.message;
                settingsNameStatus.className = 'settings-status error';
            }
            settingsNameSave.disabled = false;
            settingsNameSave.textContent = 'Simpan';
        });
    }

    // Export all data
    if (settingsExportBtn) {
        settingsExportBtn.addEventListener('click', async function () {
            try {
                var projects = await FG.api.projects();
                var folders = await FG.api.folders();
                var exportData = { projects: projects, folders: folders, exportedAt: new Date().toISOString() };
                var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url; a.download = 'flowgram-export.json'; a.click();
                URL.revokeObjectURL(url);
                showToast('Data berhasil diekspor');
            } catch (e) {
                showToast('Gagal ekspor: ' + e.message);
            }
        });
    }

    // Delete account
    if (settingsDeleteBtn) {
        settingsDeleteBtn.addEventListener('click', async function () {
            if (!confirm('Yakin ingin menghapus akun dan semua data? Tindakan ini tidak bisa dibatalkan.')) return;
            settingsDeleteBtn.disabled = true;
            settingsDeleteBtn.textContent = 'Menghapus...';
            try {
                var res = await fetch('/api/auth/account', {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + FGAuth.getToken() }
                });
                var data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Gagal');
                FGAuth.logout();
            } catch (e) {
                showToast('Gagal hapus akun: ' + e.message);
                settingsDeleteBtn.disabled = false;
                settingsDeleteBtn.textContent = 'Delete account';
            }
        });
    }

    if (profileSettingsAction) {
        profileSettingsAction.addEventListener('click', function () {
            profileDropdown.classList.remove('visible');
            openSettings();
        });
    }

    if (profileAuthAction) {
        profileAuthAction.addEventListener('click', function () {
            profileDropdown.classList.remove('visible');
            if (FGAuth.isDemo()) {
                window.__fgPendingMigration = true;
                FGAuth.showAuthGate();
            } else {
                FGAuth.logout();
            }
        });
    }

    /* ---------------- init ---------------- */
    initTheme();
    FG.migrateLegacyIfNeeded();

    var user = null;

    function fetchUserFromStorage() {
        try {
            var raw = localStorage.getItem('fg_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    function startHome(user) {
        renderProfile(user);
        if (user && user.id && user.id !== 'demo') {
            showAvatar(user);
            fetchApiData();
        } else {
            renderAll();
            fadeOutLoader();
        }
    }

    function normalizeProject(p) {
        return {
            id: p.id,
            name: p.name,
            folderId: p.folder_id,
            archived: p.archived,
            color: p.color,
            nodeCount: p.node_count,
            createdAt: new Date(p.created_at).getTime(),
            updatedAt: new Date(p.updated_at).getTime()
        };
    }

    function denormalizeProject(p, data) {
        return {
            name: p.name,
            folderId: p.folderId,
            color: p.color,
            data: data || { nodes: [], connections: [] }
        };
    }

    var apiProjects = [];
    var apiFolders = [];

    function setupApiOverrides() {
        FG.getIndex = function () { return apiProjects; };
        FG.getFolders = function () { return apiFolders; };

        FG.createProject = function (opts) {
            opts = opts || {};
            var data = opts.data || { nodes: [], connections: [] };
            var meta = {
                id: FG.uid('p'),
                name: opts.name || 'Untitled',
                folderId: opts.folderId || null,
                archived: false,
                color: opts.color || null,
                nodeCount: data.nodes.length,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            apiProjects.push(meta);
            FG.api.createProject({ name: meta.name, folderId: meta.folderId, data: data }).catch(function () { });
            return meta;
        };

        FG.renameProject = function (id, name) {
            var p = apiProjects.find(function (x) { return x.id === id; });
            if (p) { p.name = name; p.updatedAt = Date.now(); }
            FG.api.updateProject(id, { name: name }).catch(function () { });
        };

        FG.setArchived = function (id, archived) {
            var p = apiProjects.find(function (x) { return x.id === id; });
            if (p) { p.archived = archived; p.updatedAt = Date.now(); }
            FG.api.updateProject(id, { archived: archived }).catch(function () { });
        };

        FG.deleteProject = function (id) {
            apiProjects = apiProjects.filter(function (x) { return x.id !== id; });
            FG.api.deleteProject(id).catch(function () { });
        };

        FG.duplicateProject = function (id) {
            var src = apiProjects.find(function (x) { return x.id === id; });
            if (!src) return null;
            var meta = {
                id: FG.uid('p'),
                name: src.name + ' (Copy)',
                folderId: src.folderId,
                archived: false,
                color: src.color,
                nodeCount: src.nodeCount,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            apiProjects.push(meta);
            FG.api.createProject({ name: meta.name, folderId: meta.folderId }).catch(function () { });
            return meta;
        };

        FG.moveToFolder = function (id, folderId) {
            var p = apiProjects.find(function (x) { return x.id === id; });
            if (p) { p.folderId = folderId; p.updatedAt = Date.now(); }
            FG.api.updateProject(id, { folderId: folderId }).catch(function () { });
        };

        FG.createFolder = function (name) {
            var f = { id: FG.uid('f'), name: name };
            apiFolders.push(f);
            FG.api.createFolder(name).catch(function () { });
            return f;
        };

        FG.renameFolder = function (id, name) {
            var f = apiFolders.find(function (x) { return x.id === id; });
            if (f) f.name = name;
            FG.api.renameFolder(id, name).catch(function () { });
        };

        FG.deleteFolder = function (id) {
            apiFolders = apiFolders.filter(function (x) { return x.id !== id; });
            apiProjects.forEach(function (p) { if (p.folderId === id) p.folderId = null; });
            FG.api.deleteFolder(id).catch(function () { });
        };
    }

    async function fetchApiData() {
        try {
            var rawProjects = await FG.api.projects();
            var rawFolders = await FG.api.folders();
            apiProjects = rawProjects.map(normalizeProject);
            apiFolders = rawFolders;

            setupApiOverrides();
            renderAll();
            fadeOutLoader();
        } catch (e) {
            showToast('Gagal memuat data: ' + e.message);
            renderAll();
            fadeOutLoader();
        }
    }

    function fadeOutLoader() {
        setTimeout(function () {
            var overlay = document.getElementById('loader-overlay');
            if (overlay) overlay.classList.add('fade-out');
        }, 300);
    }

    var authStatus = FGAuth.init();
    if (authStatus === 'needs_login') {
        window.addEventListener('fg-auth-ready', function () {
            var u = fetchUserFromStorage();
            startHome(u);
        });
    } else if (authStatus === 'validating') {
        window.addEventListener('fg-auth-ready', function () {
            var u = fetchUserFromStorage();
            startHome(u);
        });
    } else {
        // demo — sudah siap
        startHome(fetchUserFromStorage());
    }

})();