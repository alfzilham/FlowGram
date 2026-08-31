# Prompt OpenCode — FlowGram Backend & Product Foundations

Kamu adalah agent backend/platform untuk project FlowGram. Baca seluruh repository dan dokumen berikut sebelum mengubah file:

- `documentation/FEATURE-ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTEXT.md`
- `docs/SPEC.md`
- `docs/notes/REPORT.md`
- `package.json`, `Dockerfile`, `docker-compose.yml`, `api/`, `db/`, `server/`

## Tugas

Implementasikan bagian backend dan fondasi product secara incremental, dengan prioritas:

1. Autosave protocol: status/retry yang dapat dikonsumsi frontend, idempotency bila diperlukan, dan error contract yang konsisten.
2. Workflow version history: model database, repository, service, API endpoint, retention policy, snapshot/restore, serta ownership enforcement.
3. Server-side workflow validation dan diagnostics yang tetap membatasi ukuran, jumlah, tipe, ID, koneksi, koordinat, dan payload.
4. Template API dan persistence contract untuk built-in serta user templates.
5. Search/tag/filter API yang ownership-scoped.
6. Versioned import/export contract menggunakan `schemaVersion`, preview, merge/replace, dan backward compatibility.
7. Trash/restore dan duplicate project dengan ID baru serta relasi folder yang aman.
8. Workspace backup/export, activity metadata, dan migration/versioning support bila justified oleh schema aktual.
9. Automated tests untuk auth, authorization/IDOR, ownership folder, validation, malformed input, error handling, dan persistence.
10. Rate limiting/login abuse protection dan observability yang tidak mencatat token, secret, access token Google, atau full workflow sensitif jika desain runtime mendukungnya.

## Batasan wajib

- Jangan mengerjakan redesign visual/frontend kecuali perubahan contract kecil benar-benar diperlukan.
- Jangan memindahkan token ke URL/log/DOM.
- Jangan menghapus atau melemahkan `user_id` predicates.
- Jangan trust user ID dari request body.
- Pertahankan route dan response lama; jika endpoint baru diperlukan, dokumentasikan contract-nya.
- Pertahankan demo mode, login mode, Neon, Docker, OAuth state, CORS allowlist, JWT HS256, request limit, generic errors, dan security headers.
- Jangan mengubah database production secara langsung tanpa migration yang idempotent dan persetujuan eksplisit. Untuk local verification gunakan Neon yang dikonfigurasi project atau migration command yang aman.
- Jangan commit/push sendiri. Workspace dipakai agent lain; buat perubahan scoped dan tinggalkan ringkasan file/contract yang berubah.

## Cara kerja

1. Reconnaissance dan dependency map terlebih dahulu.
2. Tulis migration/schema plan sebelum perubahan database.
3. Implementasikan satu vertical slice per fitur: model → repository → service → controller → validation → tests → docs.
4. Jangan membuat modul hipotetis yang tidak diperlukan codebase.
5. Verifikasi semua route dengan authenticated dan unauthenticated cases.
6. Jalankan `npm audit --omit=dev`, syntax checks, API negative tests, dan Docker smoke test.
7. Periksa kompatibilitas dengan controller frontend yang sudah ada sebelum mengubah response.
8. Laporkan fitur yang belum selesai, migration assumptions, regression risk, dan command validasi.

## Security review wajib

Re-check FG-001 sampai FG-009 dari `docs/notes/REPORT.md`, terutama ownership, workflow validation, JWT handling, OAuth state, error leakage, CORS, dan localStorage. Jika menemukan vulnerability baru, klasifikasikan evidence/status/severity/confidence dan jangan menyamarkannya sebagai refactor.

## Output

Berikan ringkasan perubahan, file yang disentuh, API/schema contract, migration instructions, tests yang lulus/gagal, known limitations, dan handoff notes untuk Antigravity serta Codex. Jangan menyatakan aman hanya karena test dasar lulus.
