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
        return data.user;
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
            const user = await exchangeGoogleToken(googleToken);
            if (authResolve) { authResolve(user); authResolve = null; }
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
                btnGoogle.disabled = false;
                btnGoogle.innerHTML = '<svg class="google-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Masuk dengan Google';
            });
        }

        const btnDemo = document.getElementById('btn-demo');
        if (btnDemo) {
            btnDemo.addEventListener('click', enterDemoMode);
        }
    });

})();
