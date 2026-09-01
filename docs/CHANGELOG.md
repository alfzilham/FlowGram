# Changelog

Semua perubahan frontend penting pada proyek **FlowGram** didokumentasikan dalam berkas ini.

---

## [Database Migration Note] — 2026-09-01

- Dokumentasi setup diperjelas: `scripts/init-db.js` perlu dijalankan setelah perubahan schema atau pada database yang belum menerapkan migration.
- Ini memastikan kolom `deleted_at` tersedia sebelum query project/folder soft-delete digunakan oleh server.

---

## [OAuth Popup Compatibility] — 2026-09-01

- Header `Cross-Origin-Opener-Policy: same-origin-allow-popups` ditambahkan agar popup Google OAuth tetap dapat diamati oleh halaman pembuka selama redirect.
- Ini menghilangkan konflik browser pada akses `window.closed` tanpa mengekspos token ke URL atau mengubah validasi OAuth state.
- Peringatan Tracking Prevention dari resource pihak ketiga tetap bergantung pada kebijakan browser dan tidak berasal dari exception aplikasi FlowGram.

---

## [Default Local Port] — 2026-09-01

- Default port Node.js diubah dari `3000` menjadi `3002`.
- Dokumentasi dan contoh `ALLOWED_ORIGINS` diselaraskan ke `http://localhost:3002`.
- Nilai `PORT` tetap dapat dioverride melalui environment variable.

---

## [Remove Docker Deployment] — 2026-09-01

- Artefak `Dockerfile`, `docker-compose.yml`, dan `.dockerignore` dihapus dari project.
- Runtime lokal resmi sekarang menggunakan Node.js langsung melalui `npm start` atau `npm run dev`.
- Dokumentasi penggunaan, arsitektur, dan konteks diperbarui agar tidak lagi bergantung pada Docker.

---

## [Feature Security Hardening] — 2026-09-01

- Version snapshot kini memverifikasi kepemilikan project, memvalidasi workflow, dan membatasi label versi.
- Tag project kini hanya dapat dibuat atau dibaca oleh pemilik project; pencarian mengecualikan project yang sudah di-trash.
- Workspace import memvalidasi jumlah dan struktur item, membuat ID baru, serta memetakan folder internal agar ID eksternal tidak dapat menunjuk ke folder user lain.
- Template, legacy import, dan version history menggunakan validasi workflow server-side.
- Query project/folder normal mengecualikan data soft-deleted.
- Rate limiter tidak mempercayai `X-Forwarded-For` kecuali `TRUST_PROXY=true`.
- Modul autosave browser duplikat yang tidak dipakai dihapus agar hanya ada satu implementasi persistence.

---

## [Autosave UX] — 2026-09-01

- Builder kini menampilkan status penyimpanan yang dapat diakses melalui `role="status"`: `Menyimpan…`, `Tersimpan`, `Gagal menyimpan`, dan status offline.
- Penyimpanan workflow menggunakan snapshot immutable dan sequence guard agar hasil request lama tidak menimpa status perubahan yang lebih baru.
- Kegagalan API atau kondisi offline menyimpan draft sementara per project di `localStorage`, dengan tombol `Ulangi` dan retry otomatis ketika koneksi kembali.
- Draft lokal yang lebih baru dari versi server dipulihkan saat builder dibuka dan memerlukan aksi eksplisit `Simpan ulang`.
- Perubahan hanya menyentuh UX/persistence frontend; format workflow, endpoint API, mode demo, dan mode login dipertahankan.

---

## [Local Docker Deployment] — 2026-08-30

- Deployment dipindahkan dari Vercel Functions ke Hono pada Node.js melalui `server/index.js`.
- Ditambahkan `Dockerfile` dan `docker-compose.yml` untuk menjalankan aplikasi secara lokal pada port `3000`.
- Frontend static dan API Hono kini disajikan oleh server yang sama.
- Neon tetap digunakan sebagai database eksternal melalui `DATABASE_URL`.
- Security headers yang sebelumnya berada di konfigurasi Vercel dipindahkan ke middleware server Node.
- Ditambahkan endpoint health check `GET /health`.
- `vercel.json` dan dependency CLI Vercel dihapus dari runtime project.

---

## [OAuth Login Flow Fixes] — 2026-08-30

- Neon PostgreSQL Pool kini dikonfigurasi dengan `ws` WebSocket constructor agar koneksi database bekerja pada runtime Node/Docker.
- Ditambahkan `db/schema.sql` dan `scripts/init-db.js` untuk inisialisasi idempotent tabel `users`, `folders`, `projects`, serta index ownership.
- Dependency `hono` diperbarui dan runtime JWT dibatasi secara eksplisit ke algoritma `HS256`; CORS tidak lagi mengaktifkan credential cookies yang tidak digunakan.
- Login sekarang membuka popup secara synchronous sebelum request konfigurasi agar tidak mudah diblokir browser.
- Hasil callback menunggu proses exchange token selesai sebelum menampilkan status berhasil.
- Reload halaman hanya dilakukan setelah login sukses; error backend tetap terlihat dan tombol login dapat digunakan kembali.
- Popup yang diblokir atau ditutup pengguna ditangani dengan status pembatalan yang jelas.
- Duplikasi event `fg-auth-ready` pada demo mode dihapus.

---

## [UI/UX Revamp] — 2026-08-30

Pembaruan menyeluruh pada antarmuka pengguna (UI) dan pengalaman pengguna (UX) FlowGram dengan memadukan 3 arah desain utama:
1. **Modern Glassmorphism**: Penggunaan *backdrop-filter blur*, *layered elevation shadows*, serta gradasi aksen halus (*indigo-to-violet*).
2. **Soft & Rounded Geometry**: Radius sudut yang lebih lembut dan ramah (*rounded corners* 12px – 24px) di seluruh kartu, modal, input, tombol, serta node builder.
3. **Playful Micro-Interactions**: Efek hover *lift/scale/shadow*, transisi *spring animation*, *glowing pulse connector ports*, serta animasi *flowing dashed connection lines*.
4. **Dynamic Auto-Content Node Sizing**: Penyesuaian dimensi `.node` kanvas menjadi `width: max-content` dengan `min-width: 120px`, `max-width: 360px`, `word-break: normal`, dan `overflow-wrap: break-word` agar teks melebar secara alami tanpa terpotong per huruf vertikal.

---

### 1. Design System & CSS Tokens (`public/css/variable.css`, `css/variable.css`)
- **Light & Dark Theme Tokens**:
  - Palet warna konsisten berbasis Indigo modern (`--accent: #6366F1`, `--accent-hover: #4F46E5`, `--accent-light: #818CF8`).
  - Penambahan token Glassmorphism: `--surface-glass`, `--surface-glass-heavy`, `--border-glass`, `--shadow-glass`.
  - Sistem bayangan bertingkat multi-layer: `--shadow-xs` hingga `--shadow-xl`, `--shadow-card`, `--shadow-card-hover`, `--shadow-glow`.
  - Token radius seragam: `--radius-xs` (6px), `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (18px), `--radius-xl` (22px), `--radius-2xl` (28px).
- **Animation Keyframes**:
  - `@keyframes flowDash`: Animasi aliran dinamis pada koneksi alur builder SVG.
  - `@keyframes modalBackdropIn` & `@keyframes modalScaleIn`: Animasi dialog modal dengan kurva *spring bezier*.
  - `@keyframes ctxIn`: Transisi pop-in cepat untuk context menu.
  - `@keyframes floatOrb` & `@keyframes authFloat`: Efek floating ambient light orbs pada halaman Auth dan Onboarding.
  - `@keyframes pulsePort`: Efek detak glow pada port konektor node.
- **A11y & Motion Preference**:
  - `@media (prefers-reduced-motion: reduce)` diterapkan untuk menghormati preferensi aksesibilitas pengguna.

---

### 2. Dashboard & Home Screen (`index.html`, `public/css/home.css`, `css/home.css`)
- **Glassmorphic Sidebar**:
  - Sidebar bernuansa kaca transparan dengan logo FlowGram berkilau dan efek tilt interaktif saat di-hover.
  - Navigasi berbentuk *pill items* dengan indikator gradasi dan transisi halus.
  - Folder tree modern dengan tombol *create folder* dan *dropdown menu*.
  - Widget profil mini di bagian bawah sidebar dengan badge status dan menu pengaturan.
- **Top Bar & Search**:
  - Search input yang responsif dengan efek focus glow ring (`0 0 0 3px var(--accent-glow)`).
  - Tombol aksi primer ("New Project") dengan gradasi cerah, ikon SVG, dan bayangan elevasi.
  - Tombol *theme switcher* (Dark/Light) terintegrasi dengan transisi ikon matahari/bulan.
- **Project Cards Grid**:
  - Kartu project dengan sudut melengkung 18px (`var(--radius-lg)`), thumbnail gradient dinamis yang unik per project, serta chip penghitung node melayang (*floating node badge*).
  - Efek hover *card lift* (`translateY(-4px)`), bayangan kedalaman, serta border glow.
  - Tombol menu 3-titik (*action trigger*) dengan dropdown opsi: Buka, Ubah Nama, Pindah Folder, Duplikat, Arsipkan, dan Hapus.
- **Settings Modal**:
  - Modal 2 kolom modern (gaya ChatGPT / modern workspace) dengan tab navigasi: Umum, Tema, Font, Akun, dan Storage.
  - Selector font interaktif dengan live-preview tipografi (Inter, Jakarta Sans, Poppins, Montserrat, Lato, Space Grotesk, JetBrains Mono).
- **Aksesibilitas**:
  - Penambahan atribut `aria-label` pada semua tombol berbasis ikon (hamburger, search, theme, new folder, create project).

---

### 3. Workflow Builder Canvas (`builder.html`, `public/css/layout.css`, `public/css/components.css`, `css/layout.css`, `css/components.css`)
- **Floating Glass Toolbar**:
  - Toolbar mengambang di bagian atas canvas dengan latar kaca *frosted glass* (`backdrop-filter: var(--blur-md)`), sudut membulat 22px (`var(--radius-xl)`), dan multi-tier drop shadow.
  - Tombol toolbar dengan efek hover *elevation* dan *active spring scale*.
  - Pembaruan ikon Reset Tampilan (`#btn-reset-view`) menggunakan ikon Lucide `rotate-ccw` yang lebih modern, bersih, dan proporsional.
  - Badge zoom level dengan angka tabular (*monospaced tabular numbers*).
- **Modern Canvas & Grid**:
  - Latar kanvas dengan pola *radial dot grid* yang halus dan bersih.
  - Marquee selection box dengan efek garis putus-putus aksen dan latar glowing transparan.
  - Empty state kanvas dengan wadah kaca elegan dan panduan shortcut interaktif.
- **Node Components**:
  - Ukuran node dinamis dengan `width: max-content`, `min-width: 120px`, `max-width: 360px`, `word-break: normal`, dan `overflow-wrap: break-word` yang otomatis menyesuaikan panjang teks secara horizontal tanpa terpotong per huruf vertikal.
  - Node card dengan sudut membulat 18px, border tipis berbayang, dan animasi drag *spring scale*.
  - Status terpilih (*selected state*) dengan ring glow aksen (`0 0 0 3px var(--accent-soft-hover), 0 0 20px var(--accent-glow)`).
  - Port konektor lingkaran 12px dengan efek zoom hover 1.4x dan lingkaran denyut halo.
  - Garis koneksi kurva Bezier dengan *animated stroke dash* dan efek glowing hover.
- **Context Menus & Modals**:
  - Context menu & submenu dengan *pill layout*, selector palet warna melingkar, dan grid icon picker yang interaktif.
  - Modal Konfirmasi "Hapus Semua" dan modal "Keyboard Shortcuts" dengan backdrop blur dan styled `<kbd>` chips.

---

### 4. Auth & Onboarding (`auth/google-callback.html`, `onboarding.html`, `public/css/auth.css`, `public/css/onboarding.css`, `css/auth.css`, `css/onboarding.css`)
- **Auth Gate**:
  - Desain *split-screen* yang dipercantik dengan *ambient floating gradient orb*, typography gradient, dan tombol Google OAuth dengan *subtle card elevation*.
  - Tombol demo mode berbentuk *dashed pill* dengan efek hover glow.
- **Google OAuth Callback**:
  - Kartu verifikasi login kaca melayang (*frosted glass card*) dengan dual-ring animated glowing spinner dan status badge konfirmasi.
- **Onboarding Experience**:
  - Form onboarding dengan input teks ber-radius halus dan focus halo.
  - Tombol CTA dengan panah interaktif yang bergeser ke kanan saat di-hover.
  - Panel visual kanan dengan logo mengambang 3D dan ambient orb.

---

### 5. Responsive & Mobile Optimization (`public/css/responsive.css`, `public/css/base.css`, `css/responsive.css`, `css/base.css`)
- **Mobile Floating Bottom Bar**:
  - Toolbar canvas bergeser ke bagian bawah layar pada perangkat mobile dengan navigasi swipe horizontal dan target sentuh ramah jari (*min-height 38px*).
  - Posisi toolbar dikunci menggunakan `position: fixed !important`, `z-index: 100`, dan `env(safe-area-inset-bottom)` serta dukungan `100dvh` (Dynamic Viewport Height) pada kontainer utama agar tidak terdorong keluar layar oleh address bar browser mobile.
- **Mobile Glass Bottom Sheet**:
  - Context menu dan pemilih icon otomatis bertransformasi menjadi *bottom sheet drawer* dengan handle bar dan transisi slide-up yang mulus pada layar smartphone (≤768px).

---

### 6. Backend, API & Security Hardening (`api/`, `vercel.json`, `package-lock.json`)
- Backend Hono direstrukturisasi menjadi lapisan MVC: `controllers/`, `services/`, `repositories/`, `models/`, `validators/`, dan `middleware/`.
- Ownership project dan folder diverifikasi berdasarkan `user_id` dari JWT pada operasi baca maupun perubahan data.
- `folderId` divalidasi agar project hanya dapat menggunakan folder milik user yang sedang login.
- Workflow JSON divalidasi server-side sebelum disimpan, termasuk tipe data, jumlah node/koneksi, ID unik, referensi koneksi, connector side, koordinat, warna, panjang teks, dan ukuran payload.
- Request API dengan `Content-Length` di atas 4 MiB ditolak untuk membatasi input berukuran berlebihan.
- CORS menggunakan allowlist `ALLOWED_ORIGINS`; saat konfigurasi kosong, mode development hanya menerima origin localhost yang tepat.
- Error internal ditangani secara generik agar detail implementasi tidak bocor ke client.
- Validasi Google profile diperketat dengan pemeriksaan `sub`, `email`, dan `email_verified`.
- Google OAuth Client ID frontend kini dibaca dari environment server melalui `GET /api/config`; tidak lagi diduplikasi sebagai nilai hardcoded pada HTML.
- Security headers disediakan oleh middleware server Node.
- Endpoint, HTTP method, response contract, format workflow, dan perilaku demo/login tetap dipertahankan.
- `package-lock.json` ditambahkan untuk menjaga dependency dan deployment tetap reproducible.

### 7. Keamanan & Integritas Data
- Tidak ada data input pengguna (*project name*, *node text*, *folder name*, *user name*) yang dirender menggunakan `innerHTML`.
- Semua manipulasi teks menggunakan DOM API aman (`textContent` / `document.createTextNode`).
- Perubahan UI/UX tidak mengubah kontrak penyimpanan `localStorage` (`wf_builder_theme`, `wf_font_pref`) maupun kontrak endpoint API. Backend tetap mempertahankan kontrak tersebut dengan tambahan validasi keamanan dan kontrol ownership.
