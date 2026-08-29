/* ========================================
   FlowGram Onboarding
   1 step: input nama → simpan → redirect
   ======================================== */

(function () {
    "use strict";

    var token = null;
    try { token = localStorage.getItem('fg_token'); } catch (e) { }

    if (!token || token === 'demo') {
        window.location.href = '/';
        return;
    }

    /* ---------------- form submit ---------------- */
    var form = document.getElementById('nameForm');
    var input = document.getElementById('displayName');
    var errorEl = document.getElementById('nameError');
    var btn = document.getElementById('nameContinue');

    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var name = input.value.trim();
        if (!name) {
            errorEl.textContent = 'Nama tidak boleh kosong.';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        try {
            var res = await fetch('/api/auth/name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ name: name })
            });

            var data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal menyimpan nama');

            // Update local user data
            var user = null;
            try { user = JSON.parse(localStorage.getItem('fg_user')); } catch (e) { }
            if (!user) user = {};
            user.name = name;
            try { localStorage.setItem('fg_user', JSON.stringify(user)); } catch (e) { }

            window.location.href = '/';
        } catch (err) {
            errorEl.textContent = err.message;
            btn.disabled = false;
            btn.innerHTML = 'Lanjutkan <span>→</span>';
        }
    });

    /* ---------------- enter key behaviour ---------------- */
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') form.dispatchEvent(new Event('submit'));
    });

})();
