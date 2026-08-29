# FlowGram — Context

## Identitas proyek

FlowGram v1.0.0 adalah personal web app karya Alfiz Ilham dengan lisensi MIT. Produk ini adalah visual workflow builder yang menggabungkan editor infinite canvas dengan dashboard multi-project.

## Stack

- Frontend: HTML, CSS, dan vanilla JavaScript; browser scripts dimuat sebagai IIFE biasa tanpa bundler.
- Backend: Hono 4.7 pada Vercel Functions.
- Database: Neon serverless PostgreSQL.
- Auth: Google OAuth 2.0 dan JWT (`jsonwebtoken`).
- Icon: Lucide UMD pada builder; Bootstrap Icons pada dashboard.
- Font: Google Fonts; pilihan pengguna disimpan di localStorage.
- Deploy routing: `vercel.json` meneruskan `/api/(.*)` ke `api/index.js`.

## Struktur penting

```text
api/       backend dan database pool
auth/      callback OAuth
assets/    logo dan favicon
css/       reset, variable, layout, component, page, responsive, auth
js/        auth, shared data, dashboard, builder, onboarding
index.html dashboard
builder.html editor
onboarding.html onboarding nama
```

## Vocabulary

- **Project**: container workflow beserta metadata dashboard.
- **Folder**: pengelompokan project; project hanya memiliki satu `folderId` atau root.
- **Node**: kartu di canvas yang punya koordinat dan teks.
- **Connection**: relasi berarah antara dua node dan sisi anchor masing-masing.
- **Demo mode**: token sentinel `demo`, persistence lokal, tanpa request API.
- **Login mode**: token JWT, persistence cloud, endpoint API aktif.

## Source of truth

Pada demo, source of truth adalah localStorage melalui `FG`. Pada login, database adalah source of truth untuk reload berikutnya, sementara dashboard memakai array lokal optimistic sampai fetch/reload berikutnya. Builder menyimpan data project secara langsung lewat API.

## State lifecycle

```text
auth init
  ├─ no token → auth gate
  ├─ demo → local data
  └─ JWT → validate /me → fetch API data
                         ↓
                    render page
                         ↓
             user action → debounce save
```

State builder yang tidak dipersistenkan: selection, history, clipboard, menu/modal aktif. State yang dipersistenkan: nodes, connections, viewport, serta metadata project.

## Konfigurasi

Environment backend yang dibutuhkan README: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`, `JWT_SECRET`. Client ID juga ditanam sebagai meta tag di `index.html` dan `builder.html`. Callback OAuth adalah `/auth/google-callback.html`.

## Cara menjalankan

```bash
npm install
npx serve .
# opsional, untuk API lokal:
npx vercel dev
```

Frontend sebaiknya dibuka melalui HTTP, bukan `file://`. Repository tidak memiliki build command, lint command, atau test command.

## Catatan pemeliharaan

- Pertahankan urutan pemuatan `shared.js`, `auth.js`, lalu controller halaman.
- Jika mengubah schema workflow, ubah loader demo, loader API, import/export, dan endpoint project bersama-sama.
- Jika mengubah metadata API snake_case, perbarui `normalizeProject`/`normalizeFolder` di `home.js`.
- Semua perubahan data user harus mempertahankan filter `user_id` di backend.
- Error API dashboard saat ini banyak ditangani secara silent; perubahan ke optimistic UI perlu menambahkan rollback atau status sinkronisasi.
