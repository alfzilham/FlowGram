# FlowGram — Design

## Arah visual

FlowGram memakai bahasa visual minimal, bersih, dan desktop-first dengan aksen indigo. Dashboard terasa seperti workspace produktivitas; builder memprioritaskan ruang canvas dan kontrol ringkas.

## Design tokens

Token utama berada di `css/variable.css`:

- Light: background `#f0f0f0`, surface putih, teks `#18181B`, accent `#6366F1`.
- Dark: background `#19191C`, surface `#212126`, teks `#F1F1F3`, accent `#818CF8`.
- Radius umum: `14px`.
- Shadow: `sm`, `md`, `lg` untuk card, dialog, dan overlay.
- State danger: merah `#EF4444`; koneksi dan connector memakai turunan indigo.

Theme disimpan di `wf_builder_theme`; jika belum ada, aplikasi mengikuti `prefers-color-scheme`. Font pilihan disimpan oleh dashboard di localStorage dan diterapkan sebagai style tampilan.

## Layout dashboard

- Sidebar tetap di kiri: logo, navigasi filter, folder, dan profil.
- Main area berisi topbar, search, theme/account actions, tombol New Project, lalu grid card project.
- Context menu dipakai untuk aksi card/folder; modal dipakai untuk rename, delete, move folder, dan settings.
- Mobile menggunakan hamburger, sidebar yang didorong/overlay, dan layout responsif.

## Layout builder

- Toolbar horizontal di atas menyediakan home, add node, zoom, reset, export/import, theme, clear, dan multi-select.
- `#canvas-wrapper` menjadi viewport; `#world` menerima transform `translate + scale`.
- SVG connection layer berada di belakang `#nodes-layer`.
- Node berbentuk kartu dengan empat connector dot di sisi top/right/bottom/left dan tombol options.
- Empty state berada di tengah canvas saat belum ada node.
- Context menu desktop diposisikan dekat pointer; pada mobile berubah menjadi bottom sheet dengan backdrop dan handle.

## Interaction patterns

- Aksi destruktif memakai dialog konfirmasi dan warna danger.
- Toast singkat memberi feedback untuk save, import/export, mode selection, dan CRUD.
- Selection ditunjukkan melalui class visual; multi-select dapat dilakukan dengan Shift atau tombol mode khusus.
- Inline editing menghindari dialog untuk teks node.
- Koneksi terlihat sebagai path Bezier dengan stroke animasi dash dan arrowhead.
- Menu dan modal dapat ditutup dengan Escape atau klik backdrop.

## Accessibility dan ergonomi

- Kontrol utama berupa button dengan `title` pada toolbar.
- Input rename/onboarding mendukung Enter; modal mendukung Escape.
- Ukuran layout diperkecil dan kontrol dipindahkan ke sheet pada layar ≤768 px.
- Ikon dekoratif berasal dari SVG/Lucide, sedangkan gambar logo memiliki alt text.

Area yang masih perlu diperkuat: fokus keyboard untuk context menu/sheet, label/ARIA untuk sebagian kontrol icon-only, validasi kontras seluruh kombinasi warna node, dan pengumuman perubahan toast untuk screen reader.

## Prinsip evolusi UI

1. Pertahankan canvas sebagai area dominan dan toolbar tetap ringkas.
2. Gunakan token CSS, bukan warna ad hoc, untuk theme baru.
3. Semua aksi desktop harus memiliki padanan touch/mobile.
4. Aksi destruktif harus jelas, dapat dibatalkan sebelum konfirmasi, dan memakai feedback hasil.
5. Jangan mengorbankan persistence feedback: bila save async gagal, UI idealnya memberi status atau rollback.
