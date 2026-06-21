/* ========================================
   FlowGram Auth Module
   Google OAuth + Token Management
   ======================================== */

(function () {
    "use strict";

    const STORAGE_KEY = 'fg_token';
    const USER_KEY = 'fg_user';

    // Handle fallback redirect from Google OAuth popup
    var googleTokenFromUrl = new URLSearchParams(window.location.search).get('google_token');
    if (googleTokenFromUrl) {
        // Clean URL
        history.replaceState(null, '', window.location.pathname + window.location.hash);
        window.__fgAuthCallback(googleTokenFromUrl);
    }

    function getConfig() {
        const meta = document.querySelector('meta[name="google-client-id"]');
        return meta ? meta.getAttribute('content') : '';
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

    /* ---------------- Google OAuth ---------------- */
    let authResolve = null;

    function handleGoogleAuth() {
        const clientId = getConfig();
        if (!clientId) {
            showAuthError('Google Sign-In tidak dikonfigurasi.');
            return;
        }

        const redirectUri = window.location.origin + '/auth/google-callback.html';
        const url = 'https://accounts.google.com/o/oauth2/v2/auth?' +
            'client_id=' + encodeURIComponent(clientId) +
            '&redirect_uri=' + encodeURIComponent(redirectUri) +
            '&response_type=token' +
            '&scope=email%20profile' +
            '&include_granted_scopes=true';

        return new Promise((resolve) => {
            authResolve = resolve;
            window.open(url, 'google-auth', 'width=500,height=650');
        });
    }

    window.__fgAuthCallback = async function (googleToken) {
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
                    console.warn('Migration error:', e);
                }
                window.location.href = '/';
                return;
            }

            if (isNew) {
                window.location.href = '/onboarding/name.html';
                return;
            }

            // Returning user — reload biar FGAuth.init() jalan lagi
            if (authResolve) {
                authResolve(user);
                authResolve = null;
            } else {
                // Called from auth gate without promise — reload
                window.location.reload();
            }
        } catch (e) {
            if (authResolve) { authResolve(null); authResolve = null; }
            showAuthError(e.message || 'Gagal login dengan Google');
        }
    };

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
            window.dispatchEvent(new CustomEvent('fg-auth-ready'));
            return 'demo';
        }

        if (token) {
            validateToken().then(function (user) {
                if (user) {
                    closeAuthGate();
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
                await handleGoogleAuth();
                // Returning user — reload page to trigger FGAuth.init()
                window.location.reload();
            });
        }

        const btnDemo = document.getElementById('btn-demo');
        if (btnDemo) {
            btnDemo.addEventListener('click', enterDemoMode);
        }
    });

})();
