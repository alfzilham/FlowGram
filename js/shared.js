(function (global) {
    "use strict";

    /* ====================================================================
       FlowGram Shared Data Layer
       Dipakai bersama oleh home.js (homepage) dan main.js (builder).
       Mengelola: index project, folder, data per-project (localStorage),
       dan migrasi otomatis dari format lama (single-project).
    ==================================================================== */

    const IDX_KEY = 'wf_projects_index';
    const FOLDERS_KEY = 'wf_folders';
    const OLD_STATE_KEY = 'wf_builder_state_v1'; // key lama (single-project)
    const PROJECT_PREFIX = 'wf_project_';

    function uid(p) {
        return p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function safeParse(raw, fallback) {
        if (!raw) return fallback;
        try {
            const v = JSON.parse(raw);
            return v == null ? fallback : v;
        } catch (e) {
            return fallback;
        }
    }

    function readLS(key, fallback) {
        try { return safeParse(localStorage.getItem(key), fallback); }
        catch (e) { return fallback; }
    }
    function writeLS(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; }
        catch (e) { return false; }
    }
    function removeLS(key) {
        try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    }

    /* ---------------- projects index ---------------- */
    function getIndex() { return readLS(IDX_KEY, []); }
    function saveIndex(list) { writeLS(IDX_KEY, list); }

    function getProject(id) {
        return getIndex().find(p => p.id === id) || null;
    }

    function updateProjectMeta(id, patch) {
        const list = getIndex();
        const meta = list.find(p => p.id === id);
        if (!meta) return null;
        Object.assign(meta, patch);
        saveIndex(list);
        return meta;
    }

    /* ---------------- project data (nodes/connections/viewport) ---------------- */
    function projectKey(id) { return PROJECT_PREFIX + id; }

    function getProjectData(id) {
        return readLS(projectKey(id), null);
    }
    function saveProjectData(id, data) {
        writeLS(projectKey(id), data);
    }
    function deleteProjectData(id) {
        removeLS(projectKey(id));
    }

    function emptyProjectData() {
        return { nodes: [], connections: [], viewport: { panX: 80, panY: 80, zoom: 1 } };
    }

    /* ---------------- CRUD project ---------------- */
    function createProject(opts) {
        opts = opts || {};
        const data = opts.data || emptyProjectData();
        const meta = {
            id: uid('p'),
            name: opts.name || 'Untitled Project',
            folderId: opts.folderId || null,
            archived: false,
            color: opts.color || null,
            nodeCount: Array.isArray(data.nodes) ? data.nodes.length : 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        const list = getIndex();
        list.push(meta);
        saveIndex(list);
        saveProjectData(meta.id, data);
        return meta;
    }

    function renameProject(id, name) {
        return updateProjectMeta(id, { name: name, updatedAt: Date.now() });
    }

    function setArchived(id, archived) {
        return updateProjectMeta(id, { archived: !!archived, updatedAt: Date.now() });
    }

    function moveToFolder(id, folderId) {
        return updateProjectMeta(id, { folderId: folderId || null });
    }

    function deleteProject(id) {
        saveIndex(getIndex().filter(p => p.id !== id));
        deleteProjectData(id);
    }

    function duplicateProject(id) {
        const meta = getProject(id);
        if (!meta) return null;
        const data = getProjectData(id) || emptyProjectData();
        return createProject({
            name: meta.name + ' (Copy)',
            folderId: meta.folderId,
            color: meta.color,
            data: JSON.parse(JSON.stringify(data))
        });
    }

    function archiveFolder(id, archived) {
        const list = getIndex();
        list.forEach(p => {
            if (p.folderId === id) {
                p.archived = !!archived;
                p.updatedAt = Date.now();
            }
        });
        saveIndex(list);
    }

    function duplicateFolder(id) {
        const folders = getFolders();
        const src = folders.find(f => f.id === id);
        if (!src) return null;
        const newFolder = createFolder(src.name + ' (Copy)');
        const list = getIndex();
        const projectsInFolder = list.filter(p => p.folderId === id);
        projectsInFolder.forEach(p => {
            const data = getProjectData(p.id) || emptyProjectData();
            createProject({
                name: p.name,
                folderId: newFolder.id,
                color: p.color,
                data: JSON.parse(JSON.stringify(data))
            });
        });
        return newFolder;
    }

    // Dipanggil dari builder.html setiap kali auto-save terjadi.
    function recordProjectSave(id, data) {
        saveProjectData(id, data);
        updateProjectMeta(id, {
            nodeCount: Array.isArray(data.nodes) ? data.nodes.length : 0,
            updatedAt: Date.now()
        });
    }

    /* ---------------- folders ---------------- */
    function getFolders() { return readLS(FOLDERS_KEY, []); }
    function saveFolders(list) { writeLS(FOLDERS_KEY, list); }

    function createFolder(name) {
        const list = getFolders();
        const folder = { id: uid('f'), name: name || 'New Folder', archived: false };
        list.push(folder);
        saveFolders(list);
        return folder;
    }

    function renameFolder(id, name) {
        const list = getFolders();
        const f = list.find(x => x.id === id);
        if (!f) return null;
        f.name = name;
        saveFolders(list);
        return f;
    }

    function setFolderArchived(id, archived) {
        const list = getFolders();
        const f = list.find(x => x.id === id);
        if (!f) return null;
        f.archived = !!archived;
        saveFolders(list);
        // Archive/unarchive semua project di dalamnya
        const projects = getIndex();
        let changed = false;
        projects.forEach(p => {
            if (p.folderId === id) {
                p.archived = !!archived;
                p.updatedAt = Date.now();
                changed = true;
            }
        });
        if (changed) saveIndex(projects);
        return f;
    }

    function deleteFolder(id) {
        saveFolders(getFolders().filter(f => f.id !== id));
        const list = getIndex();
        let changed = false;
        list.forEach(p => { if (p.folderId === id) { p.folderId = null; changed = true; } });
        if (changed) saveIndex(list);
    }

    /* ---------------- migrasi dari format lama ---------------- */
    // Idempotent: hanya jalan sekali. Setelah index project ada (meski kosong),
    // migrasi tidak akan dijalankan ulang lagi.
    function migrateLegacyIfNeeded() {
        const indexAlreadyExists = localStorage.getItem(IDX_KEY) !== null;
        if (indexAlreadyExists) return false;

        let legacyRaw;
        try { legacyRaw = localStorage.getItem(OLD_STATE_KEY); } catch (e) { legacyRaw = null; }

        if (!legacyRaw) {
            saveIndex([]); // tandai index sudah "diinisialisasi" supaya tidak dicek ulang
            return false;
        }

        const legacy = safeParse(legacyRaw, null);
        if (!legacy || !Array.isArray(legacy.nodes)) {
            saveIndex([]);
            return false;
        }

        const data = {
            nodes: legacy.nodes || [],
            connections: legacy.connections || [],
            viewport: legacy.viewport || { panX: 80, panY: 80, zoom: 1 }
        };

        createProject({ name: 'Project 1', data: data });
        removeLS(OLD_STATE_KEY); // hapus data lama supaya tidak migrasi dobel
        return true;
    }

    function fgToken() { try { return localStorage.getItem('fg_token'); } catch (e) { return null; } }

    async function apiCall(method, path, body) {
        const token = fgToken();
        if (!token || token === 'demo') throw new Error('Not logged in');
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
        };
        if (body && (method === 'POST' || method === 'PUT')) opts.body = JSON.stringify(body);
        const res = await fetch('/api' + path, opts);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API error');
        return data;
    }

    /* ---------------- export ---------------- */
    global.FG = {
        uid,
        // index
        getIndex, saveIndex, getProject, updateProjectMeta,
        // project data
        getProjectData, saveProjectData, deleteProjectData, emptyProjectData,
        // CRUD project
        createProject, renameProject, setArchived, moveToFolder, deleteProject,
        duplicateProject, recordProjectSave,
        // folders
        getFolders, saveFolders, createFolder, renameFolder, deleteFolder,
        archiveFolder, duplicateFolder,
        setFolderArchived: function (id, archived) {
            return setFolderArchived(id, archived);
        },
        // migrasi
        migrateLegacyIfNeeded,

        // ── Demo mode flag ──
        isDemoMode: function () {
            const t = fgToken();
            return t === 'demo' || window.__fgIsDemo === true;
        },

        // ── Migrate demo data to user account ──
        migrateDemoToUser: async function (userId) {
            var projects = getIndex();
            var folders = getFolders();
            for (var i = 0; i < projects.length; i++) {
                var p = projects[i];
                var data = getProjectData(p.id) || emptyProjectData();
                await apiCall('POST', '/projects', {
                    name: p.name,
                    folderId: p.folderId,
                    color: p.color,
                    data: data
                });
            }
            for (var j = 0; j < folders.length; j++) {
                await apiCall('POST', '/folders', { name: folders[j].name });
            }
            removeLS(IDX_KEY);
            removeLS(FOLDERS_KEY);
        },

        // ── API layer (dipakai saat login) ──
        api: {
            // ── Auth ──
            me: function () { return apiCall('GET', '/auth/me'); },

            // ── Projects ──
            async projects() { return (await apiCall('GET', '/projects')).projects; },
            async getProject(id) { return (await apiCall('GET', '/projects/' + id)).project; },
            async createProject(data) { return (await apiCall('POST', '/projects', data)).project; },
            async updateProject(id, data) { return apiCall('PUT', '/projects/' + id, data); },
            async deleteProject(id) { return apiCall('DELETE', '/projects/' + id); },

            // ── Folders ──
            async folders() { return (await apiCall('GET', '/folders')).folders; },
            async createFolder(name) { return (await apiCall('POST', '/folders', { name })).folder; },
            async renameFolder(id, name) { return apiCall('PUT', '/folders/' + id, { name }); },
            async updateFolder(id, data) { return apiCall('PUT', '/folders/' + id, data); },
            async deleteFolder(id) { return apiCall('DELETE', '/folders/' + id); }
        }
    };

})(window);