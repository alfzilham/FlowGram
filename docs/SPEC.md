# FlowGram — Product Specification

## Tujuan

FlowGram memungkinkan pengguna membuat workflow visual berupa node yang dapat ditempatkan bebas, dihubungkan, diberi warna/icon, lalu disimpan sebagai project yang dapat dikelola dari dashboard.

## Persona dan mode

- Pengunjung: mencoba editor melalui Demo mode tanpa akun.
- Pengguna terautentikasi: menyimpan project dan folder ke cloud Neon melalui Google OAuth.
- Pengguna baru: setelah OAuth diarahkan ke onboarding untuk menetapkan nama tampilan.

## Requirements fungsional

### Auth dan onboarding

1. Login menggunakan Google OAuth implicit flow dan callback popup.
2. JWT aplikasi berlaku 30 hari.
3. Token valid dipakai untuk mengambil profil terbaru.
4. Demo mode harus dapat digunakan tanpa backend dan memakai localStorage.
5. User baru dapat menyimpan nama; user dapat menggantinya dari Settings.
6. Logout menghapus token/cache lokal dan reload halaman.
7. Delete account menghapus project, folder, lalu user.

### Dashboard

1. Menampilkan project berdasarkan update terbaru.
2. Filter: semua, archived, atau folder tertentu.
3. Search berdasarkan nama project.
4. Membuat, rename, duplicate, archive/unarchive, move, dan delete project.
5. Membuat, rename, duplicate, dan delete folder.
6. Delete folder mengeluarkan project terkait ke root.
7. Menyediakan settings untuk nama, theme, font, ekspor data, dan penghapusan akun.

### Builder

1. Membuat node dari toolbar, double-click canvas, context menu, atau `Ctrl/Cmd+N`.
2. Node memiliki posisi, teks, warna, dan optional Lucide icon.
3. Teks diedit dengan double-click; Enter menyimpan, Escape membatalkan.
4. Koneksi dibuat dengan drag dari connector sisi node ke node lain dan dirender sebagai kurva Bezier berpanah.
5. Node dapat dipilih tunggal/multi-select, dipindah, diduplikasi, dihapus, dan dicopy/paste.
6. Undo/redo menyimpan maksimal 50 snapshot.
7. Canvas mendukung pan, zoom 25%–250%, pinch-to-zoom, dan reset viewport.
8. Workflow dapat di-export/import JSON.
9. Hapus semua memerlukan konfirmasi.
10. Perubahan workflow dan viewport di-autosave.

## Kontrak data

Node minimum: `id`, `x`, `y`, `text`, `color`, `icon`.

Connection minimum: `id`, `from.nodeId`, `from.side`, `to.nodeId`, `to.side`; `side` adalah `top | right | bottom | left`.

Import/export publik saat ini berbentuk `{ nodes, connections }`; viewport tidak ikut diekspor dan viewport lama tetap dipakai saat import.

## Non-functional requirements

- Mendukung browser modern dan static file server.
- Responsif pada breakpoint mobile sekitar 768 px.
- Theme light/dark dan system preference.
- Interaksi dasar tidak memerlukan framework atau bundler.
- Data user diisolasi di backend berdasarkan JWT `userId`.

## Acceptance criteria

- Tanpa token, pengguna dapat masuk Demo mode, membuat project, membuka builder, mengedit, reload, dan mempertahankan data.
- Dengan token valid, dashboard dan builder membaca data server serta perubahan tersimpan setelah debounce autosave.
- Project yang dihapus tidak tampil lagi setelah reload; folder yang dihapus tidak meninggalkan project yatim di folder tersebut.
- Node dan koneksi tetap konsisten setelah drag, reload, undo/redo, serta export/import valid.
- Layout mobile menyediakan bottom sheet/context sheet dan sidebar yang dapat dibuka-tutup.

## Batasan implementasi saat ini

Dokumen ini merekam perilaku yang diimplementasikan, bukan kontrak masa depan. Belum ada validasi server yang terlihat untuk body project/folder, test otomatis, schema database, conflict resolution, atau indikator kegagalan autosave yang persisten.
