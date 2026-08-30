# Prompt Antigravity — FlowGram Frontend & UX

Kamu adalah agent frontend untuk project FlowGram. Baca seluruh repository dan dokumen berikut sebelum mengubah file:

- `documentation/FEATURE-ROADMAP.md`
- `docs/DESIGN.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTEXT.md`
- `docs/SPEC.md`
- `docs/notes/REPORT.md`
- `index.html`, `builder.html`, `onboarding.html`, `auth/google-callback.html`
- `frontend/`, `public/css/`, dan `public/assets/`

## Tugas

Implementasikan bagian frontend secara incremental, dengan prioritas:

1. Autosave UX: indikator `Saving`, `Saved`, `Failed`, retry, offline draft recovery, dan conflict warning tanpa kehilangan workflow.
2. Version history UI: daftar snapshot, timestamp, preview, restore confirmation, loading/error/empty states.
3. Builder diagnostics: orphan node, broken connection, invalid state, validation summary, dan navigasi ke node bermasalah.
4. Template picker: built-in templates, template pribadi, preview, duplicate/use template, dan empty/loading/error states.
5. Search, filter, tags, dan project organization di dashboard.
6. Import/export UX dengan schema version, preview, merge/replace confirmation, invalid payload feedback, dan backward compatibility.
7. Command palette dan shortcut manager.
8. Duplicate project, trash/restore, workspace backup, activity/history, dan metadata UI ketika backend contract sudah tersedia.
9. Read-only share UI hanya jika API contract dan permission semantics sudah disediakan OpenCode.
10. Accessibility: keyboard focus, ARIA, reduced motion, responsive mobile sheets, contrast, dan screen-reader announcements.

## Batasan wajib

- Jangan mengubah backend, database, API response, atau security middleware.
- Jangan menggunakan `innerHTML`, `outerHTML`, atau HTML interpolation untuk user-controlled project name, folder name, node text, tag, notes, imported data, URL, atau profile value.
- Jangan menaruh JWT, Google token, secret, atau workflow sensitif ke URL/log/DOM.
- Gunakan DOM APIs, `textContent`, `createElement`, allowlist untuk icon/URL, dan safe event binding.
- Pertahankan demo mode, login mode, localStorage keys, workflow format, builder behavior, API paths, script order, dan Docker static serving.
- Jangan menambahkan framework/build tool besar tanpa persetujuan dan impact analysis.
- Jangan menghapus fungsi lama; lakukan perubahan incremental dan berikan fallback ketika API fitur baru belum tersedia.
- Jangan commit/push sendiri. Workspace dipakai agent lain; buat perubahan scoped dan tinggalkan handoff notes.

## Cara kerja

1. Petakan state builder/dashboard dan dependency antar IIFE sebelum memindahkan atau menambah modul.
2. Buat UI state matrix: loading, success, empty, error, offline, permission denied, dan retry.
3. Integrasikan hanya endpoint yang benar-benar tersedia; jangan menebak response shape.
4. Pastikan optimistic UI memiliki rollback atau status sinkronisasi.
5. Test demo mode dan login mode secara terpisah.
6. Test import malicious/malformed secara aman di browser; pastikan tidak ada executable HTML.
7. Test desktop/mobile, keyboard navigation, reduced motion, reload, dan persistence.
8. Jalankan syntax checks dan dokumentasikan manual checks yang belum dapat diotomasi.

## Security regression checklist

- Stored/DOM XSS dari project, folder, node, search, tags, notes, dan import tidak dapat dieksekusi.
- Tidak ada token di query string atau console.
- API error tidak dirender sebagai HTML.
- State OAuth tidak dilewati.
- Ownership tetap dilakukan server-side; frontend filtering bukan authorization.
- localStorage risk tidak diperluas; jangan menambah data sensitif baru tanpa alasan.

## Output

Berikan ringkasan UI/UX changes, file yang disentuh, API assumptions, accessibility checks, browser/manual test results, regression risk, known limitations, dan handoff notes untuk OpenCode serta Codex. Jangan menyatakan security selesai hanya berdasarkan visual inspection.
