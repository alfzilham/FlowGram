# FlowGram — Architecture

## Ringkasan

FlowGram adalah aplikasi web workflow builder tanpa framework frontend dan tanpa build step. Browser menyajikan halaman HTML statis, JavaScript mengelola state/UI, dan Vercel Functions menjalankan API Hono yang menyimpan data akun ke Neon PostgreSQL.

```text
Browser
  ├─ index.html       dashboard project/folder
  ├─ builder.html     editor canvas
  ├─ onboarding.html  nama pengguna baru
  └─ auth/...         OAuth callback
       │
       ├─ Demo mode ───── localStorage
       └─ Login mode ──── /api/* ── Hono ── Neon PostgreSQL
                              └─ Google userinfo + JWT
```

## Modul frontend

- `js/auth.js`: token `fg_token`, user cache `fg_user`, Google OAuth popup, auth gate, demo mode, dan event `fg-auth-ready`.
- `js/shared.js`: facade `window.FG`; CRUD project/folder, serialisasi localStorage, migrasi format lama, API wrapper, dan migrasi demo ke akun.
- `js/home.js`: dashboard, filter/search, folder, context menu, settings, theme/font, dan adapter data API.
- `js/main.js`: editor canvas; node, koneksi, selection, drag/pan/zoom, undo/redo, clipboard, import/export, shortcut, dan autosave.
- `js/onboarding.js`: satu langkah pengisian nama dan update `/api/auth/name`.

Urutan script penting: `shared.js` → `auth.js` → halaman controller (`home.js` atau `main.js`). `FG` harus tersedia sebelum controller memulai.

## Alur startup

1. Controller halaman memanggil `FGAuth.init()`.
2. Token tidak ada → auth gate ditampilkan.
3. Token `demo` → UI langsung aktif menggunakan localStorage.
4. Token JWT → `/api/auth/me` divalidasi; user cache diperbarui; event `fg-auth-ready` dipancarkan.
5. Dashboard memuat project/folder API pada mode login. Builder mengambil `id` dari query string lalu memuat data project.
6. Loader di-fade setelah data tersedia.

## Persistence dan adapter

### Demo/localStorage

- Index metadata: `wf_projects_index`.
- Folder: `wf_folders`.
- Data workflow per project: `wf_project_<id>`.
- Format lama: `wf_builder_state_v1`; dimigrasikan sekali menjadi `Project 1`.

### Login/API

Dashboard mengganti operasi metadata `FG` dengan adapter in-memory (`apiProjects`, `apiFolders`) yang melakukan request API secara optimistic. Builder membaca dan menyimpan workflow langsung melalui `FG.api`.

Autosave builder di-debounce 300 ms. Pada demo ia menulis localStorage; pada login ia mengirim `PUT /api/projects/:id`.

## Backend

`api/index.js` adalah Hono app yang di-rewrite oleh `vercel.json` untuk seluruh `/api/*`.

- Auth: `POST /auth/google`, `GET /auth/me`, `POST /auth/name`, `DELETE /auth/account`.
- Project: `GET/POST /projects`, `GET/PUT/DELETE /projects/:id`.
- Folder: `GET/POST /folders`, `PUT/DELETE /folders/:id`.
- Semua route selain login memverifikasi Bearer JWT dan membatasi query berdasarkan `user_id`.
- `api/_db.js` membuat Neon `Pool` dari `DATABASE_URL`; ID dibuat lokal dengan prefix, timestamp, dan random suffix.

## Model data workflow

```json
{
  "nodes": [{ "id": "n_*", "x": 120, "y": 80, "text": "", "color": "default", "icon": null }],
  "connections": [{
    "id": "c_*",
    "from": { "nodeId": "n_*", "side": "right" },
    "to": { "nodeId": "n_*", "side": "left" }
  }],
  "viewport": { "panX": 80, "panY": 80, "zoom": 1 }
}
```

Project metadata menyimpan nama, folder, archive flag, warna, jumlah node, dan timestamp. Data workflow disimpan sebagai JSON di kolom `projects.data`.

## Deployment/runtime

Frontend adalah static assets yang cocok disajikan Vercel atau static server. Backend memerlukan Node.js/Vercel Functions, `DATABASE_URL`, `JWT_SECRET`, dan kredensial Google. Tidak ada test suite atau migration/schema SQL yang tersimpan di repository ini; struktur database diasumsikan sudah tersedia di Neon.

## Risiko arsitektural yang terlihat

- Operasi dashboard login bersifat optimistic dan beberapa error sengaja diabaikan; UI dapat berbeda dari server sampai reload.
- Migrasi demo mengirim folder dan project tanpa mapping ID folder lama ke ID baru, sehingga relasi folder dapat hilang.
- Import JSON hanya memvalidasi `nodes` sebagai array dan tidak memvalidasi referensi koneksi, tipe field, atau ukuran payload.
- CORS dikonfigurasi `origin: '*'` bersama `credentials: true`; konfigurasi produksi sebaiknya memakai origin yang eksplisit.
- JWT disimpan di localStorage; mitigasi XSS dan rotasi/revokasi token belum terlihat dalam codebase.
