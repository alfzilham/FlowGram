/* ========================================
   FlowGram Autosave Manager
   Debounced save with status, retry, and
   offline draft recovery.
   ======================================== */

(function (global) {
    "use strict";

    var AUTOSAVE_DEBOUNCE = 300;
    var AUTOSAVE_MAX_RETRIES = 3;
    var AUTOSAVE_BACKOFF_BASE = 1000;
    var OFFLINE_DRAFT_PREFIX = 'wf_autosave_';

    var status = 'idle'; // idle | saving | saved | failed
    var saveTimer = null;
    var retryCount = 0;
    var lastSavedAt = null;

    function getStatus() { return status; }
    function getLastSavedAt() { return lastSavedAt; }

    function setStatus(s) {
        status = s;
        global.dispatchEvent(new CustomEvent('fg-autosave-status', { detail: { status: s, savedAt: lastSavedAt } }));
    }

    function scheduleSave(projectId, getData) {
        if (!projectId) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            doSave(projectId, getData);
        }, AUTOSAVE_DEBOUNCE);
    }

    function doSave(projectId, getData) {
        var data = getData();
        if (!data) return;

        setStatus('saving');
        retryCount = 0;

        attemptSave(projectId, data, getData);
    }

    function attemptSave(projectId, data, getData) {
        if (!global.FGAuth || !global.FGAuth.isLoggedIn()) {
            // Demo mode — save to localStorage
            if (global.FG && typeof global.FG.recordProjectSave === 'function') {
                global.FG.recordProjectSave(projectId, data);
            }
            saveOfflineDraft(projectId, data);
            lastSavedAt = new Date().toISOString();
            setStatus('saved');
            return;
        }

        global.FG.api.updateProject(projectId, { data: data })
            .then(function () {
                lastSavedAt = new Date().toISOString();
                retryCount = 0;
                clearOfflineDraft(projectId);
                setStatus('saved');
            })
            .catch(function (err) {
                // Save offline draft as fallback
                saveOfflineDraft(projectId, data);

                if (retryCount < AUTOSAVE_MAX_RETRIES) {
                    retryCount++;
                    var backoff = AUTOSAVE_BACKOFF_BASE * Math.pow(2, retryCount - 1);
                    setTimeout(function () {
                        attemptSave(projectId, data, getData);
                    }, backoff);
                } else {
                    setStatus('failed');
                }
            });
    }

    function saveOfflineDraft(projectId, data) {
        try {
            localStorage.setItem(OFFLINE_DRAFT_PREFIX + projectId, JSON.stringify(data));
        } catch (e) { /* quota exceeded — ignore */ }
    }

    function clearOfflineDraft(projectId) {
        try {
            localStorage.removeItem(OFFLINE_DRAFT_PREFIX + projectId);
        } catch (e) { /* ignore */ }
    }

    function getOfflineDraft(projectId) {
        try {
            var raw = localStorage.getItem(OFFLINE_DRAFT_PREFIX + projectId);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    function hasOfflineDraft(projectId) {
        try {
            return localStorage.getItem(OFFLINE_DRAFT_PREFIX + projectId) !== null;
        } catch (e) { return false; }
    }

    function forceSave(projectId, getData) {
        clearTimeout(saveTimer);
        doSave(projectId, getData);
    }

    /* ---------------- export ---------------- */
    global.FGAutosave = {
        getStatus: getStatus,
        getLastSavedAt: getLastSavedAt,
        scheduleSave: scheduleSave,
        forceSave: forceSave,
        getOfflineDraft: getOfflineDraft,
        hasOfflineDraft: hasOfflineDraft,
        clearOfflineDraft: clearOfflineDraft
    };

})(window);
