/* ========================================
   FlowGram Auth Module
   Google OAuth + Token Management
   ======================================== */

(function () {
    "use strict";

    const STORAGE_KEY = 'fg_token';
    const USER_KEY = 'fg_user';

    async function getConfig() {
        try {
            const response = await fetch('/api/config', { cache: 'no-store' });
            if (!response.ok) return '';
            const data = await response.json();
            return typeof data.googleClientId === 'string' ? data.googleClientId : '';
        } catch (e) {
            return '';
        }
    }

    /* ---------------- Token Management ---------------- */
    function getToken() {
        try { return localStorage.getItem(STORAGE_KEY); }
        catch (e) { return null; }
    }

    function setToken(token) {
        try { localStorage.setItem(STORAGE_KEY, token); } catch (e) { }
    }

    function removeToken() {
        try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(USER_KEY); } catch (e) { }
    }

    function saveUser(user) {
        try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) { }
    }

    function loadUser() {
        try {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    /* ---------------- API Calls ---------------- */
    async function validateToken() {
        const token = getToken();
        if (!token) return null;
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) { removeToken(); return null; }
            const data = await res.json();
            saveUser(data.user);
            return data.user;
        } catch (e) {
            return null;
        }
    }

    async function exchangeGoogleToken(googleToken) {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ googleToken })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login gagal');
        setToken(data.token);
        saveUser(data.user);
        return data;
    }

    /* ---------------- Google OAuth state correlation ---------------- */
    const oauthStates = new Map();
    const OAUTH_STATE_TTL = 600000; // 10 minutes

    function generateState() {
        var arr = new Uint8Array(24);
        crypto.getRandomValues(arr);
        return Array.from(arr, function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    }

    function storeState(state) {
        oauthStates.set(state, Date.now());
    }

    function verifyState(state) {
        if (!state || !oauthStates.has(state)) return false;
        var ts = oauthStates.get(state);
        oauthStates.delete(state);
        if (Date.now() - ts > OAUTH_STATE_TTL) return false;
        return true;
    }

    /* ---------------- Google OAuth ---------------- */
    let authResolve = null;

    async function handleGoogleAuth() {
        // Open synchronously from the click handler so popup blockers do not
        // reject it while the public config request is still in flight.
        const popup = window.open('', 'google-auth', 'width=500,height=650');
        if (!popup) {
            const error = 'Popup login diblokir browser. Izinkan popup lalu coba lagi.';
            showAuthError(error);
            return { ok: false, error: error };
        }

        const clientId = await getConfig();
        if (!clientId) {
            popup.close();
            showAuthError('Google Sign-In tidak dikonfigurasi.');
            return { ok: false, error: 'Google Sign-In tidak dikonfigurasi.' };
        }

        const redirectUri = window.location.origin + '/auth/google-callback.html';
        const state = generateState();
        storeState(state);

        const url = 'https://accounts.google.com/o/oauth2/v2/auth?' +
            'client_id=' + encodeURIComponent(clientId) +
            '&redirect_uri=' + encodeURIComponent(redirectUri) +
            '&response_type=token' +
            '&scope=email%20profile' +
            '&include_granted_scopes=true' +
            '&state=' + encodeURIComponent(state);

        return new Promise((resolve) => {
            let settled = false;
            let closeWatcher = null;

            const finish = function (result) {
                if (settled) return;
                settled = true;
                if (closeWatcher) clearInterval(closeWatcher);
                if (authResolve === finish) authResolve = null;
                resolve(result);
            };

            authResolve = finish;
            popup.location.href = url;
            closeWatcher = setInterval(function () {
                if (!popup.closed) return;
                finish({ ok: false, cancelled: true, error: 'Login dibatalkan.' });
            }, 500);
        });
    }

    window.__fgAuthCallback = async function (googleToken, state) {
        if (!verifyState(state)) {
            const error = 'Login gagal: state tidak valid atau sudah kedaluwarsa.';
            showAuthError(error);
            if (authResolve) authResolve({ ok: false, error: error });
            return { ok: false, error: error };
        }

        try {
            const data = await exchangeGoogleToken(googleToken);
            var user = data.user;
            var isNew = data.isNew === true;

            if (window.__fgPendingMigration) {
                window.__fgPendingMigration = false;
                try {
                    if (window.FG && typeof FG.migrateDemoToUser === 'function') {
                        await FG.migrateDemoToUser(user.id);
                    }
                } catch (e) {
                    // silent — migration best-effort
                }
                window.location.href = '/';
                return { ok: true, user: user, redirected: true };
            }

            if (isNew) {
                window.location.href = '/onboarding.html';
                return { ok: true, user: user, redirected: true };
            }

            // Returning user — reload biar FGAuth.init() jalan lagi
            if (authResolve) {
                authResolve({ ok: true, user: user });
            } else {
                // Called from auth gate without promise — reload
                window.location.reload();
            }
            return { ok: true, user: user };
        } catch (e) {
            const error = e.message || 'Gagal login dengan Google';
            if (authResolve) authResolve({ ok: false, error: error });
            showAuthError(error);
            return { ok: false, error: error };
        }
    };

    // FG-003: Removed google_token query string fallback.
    // The popup callback uses a same-origin opener call with state validation.
    // If opener is unavailable, the callback page shows an error instead of
    // placing the bearer token in a URL query parameter.

    /* ---------------- Demo Mode ---------------- */
    function enterDemoMode() {
        setToken('demo');
        saveUser({ id: 'demo', email: null, name: 'Demo', avatarUrl: null });
        window.__fgIsDemo = true;
        closeAuthGate();
    }

    window.__fgIsDemo = false;

    /* ---------------- Auth Gate UI ---------------- */
    function showAuthGate() {
        const gate = document.getElementById('auth-gate');
        if (gate) gate.classList.add('visible');
    }

    function closeAuthGate() {
        const gate = document.getElementById('auth-gate');
        if (gate) gate.classList.remove('visible');
        window.dispatchEvent(new CustomEvent('fg-auth-ready'));
    }

    function showAuthError(msg) {
        const el = document.getElementById('auth-error');
        if (el) el.textContent = msg;
    }

    /* ---------------- Init ---------------- */
    // Returns 'demo' | 'validating' | 'needs_login' synchronously
    // Dispatches 'fg-auth-ready' when done (immediately for demo, async for validated).
    function initAuth() {
        const token = getToken();

        if (token === 'demo') {
            window.__fgIsDemo = true;
            closeAuthGate();
            return 'demo';
        }

        if (token) {
            validateToken().then(function (user) {
                if (user) {
                    closeAuthGate();
                } else {
                    showAuthGate();
                }
                window.dispatchEvent(new CustomEvent('fg-auth-ready'));
            });
            return 'validating';
        }

        showAuthGate();
        return 'needs_login';
    }

    function logout() {
        if (window.__fgIsDemo) {
            window.__fgIsDemo = false;
        }
        removeToken();
        window.location.reload();
    }

    /* ---------------- Export ---------------- */
    window.FGAuth = {
        init: initAuth,
        loginWithGoogle: handleGoogleAuth,
        logout: logout,
        showAuthGate: showAuthGate,
        getToken: getToken,
        isDemo: function () { return window.__fgIsDemo || getToken() === 'demo'; },
        isLoggedIn: function () { var t = getToken(); return t && t !== 'demo'; }
    };

    // bind DOM elements after load
    document.addEventListener('DOMContentLoaded', function () {
        const btnGoogle = document.getElementById('btn-google-auth');
        if (btnGoogle) {
            btnGoogle.addEventListener('click', async () => {
                btnGoogle.disabled = true;
                btnGoogle.textContent = 'Memproses...';
                const result = await handleGoogleAuth();
                if (result && result.ok) {
                    // Returning user — reload page to trigger FGAuth.init().
                    // New users/migrations navigate inside __fgAuthCallback.
                    if (!result.redirected) window.location.reload();
                } else {
                    btnGoogle.disabled = false;
                    btnGoogle.textContent = 'Masuk dengan Google';
                }
            });
        }

        const btnDemo = document.getElementById('btn-demo');
        if (btnDemo) {
            btnDemo.addEventListener('click', enterDemoMode);
        }
    });

})();
