# FlowGram Feature Roadmap

Dokumen ini menjadi rencana bersama untuk tiga agent: OpenCode, Antigravity, dan Codex. Implementasi dilakukan incremental dan setiap perubahan harus mempertahankan demo mode, login mode, format workflow, API ownership, serta kompatibilitas Docker + Neon.

## Tujuan

Meningkatkan FlowGram dari editor workflow menjadi workspace yang lebih andal, mudah digunakan, recoverable, dan siap dikembangkan ke sharing/collaboration tanpa mengorbankan security boundary.

## Urutan implementasi

### Phase 1 — Reliability dan fondasi

- Autosave status: `Saving`, `Saved`, `Failed`, retry, dan offline draft recovery.
- Version history workflow: snapshot, daftar versi, restore, retention yang jelas.
- Workflow validation di builder: orphan node, broken connection, duplicate/invalid state.
- Database migration/versioning dan automated API/security tests.
- Observability/logging terstruktur tanpa token, secret, atau workflow sensitif.

### Phase 2 — Productivity

- Workflow templates bawaan dan template pribadi.
- Search berdasarkan project, folder, tag, node text, dan tanggal.
- Project tags/labels.
- Import/export versioning dengan `schemaVersion`, preview, merge, dan replace.
- Command palette serta shortcut manager.

### Phase 3 — Workspace lifecycle

- Duplicate project dengan ID node/connection baru dan relasi folder yang benar.
- Trash/restore untuk project dan folder.
- Backup/export seluruh workspace.
- Project activity/history dan analytics dasar.

### Phase 4 — Sharing dan extensibility

- Read-only share link dengan token terpisah, expiry/revocation, dan redaksi data sensitif.
- Node metadata: description, notes, links, status, dan custom properties.
- Workflow execution/test mode hanya jika model keamanan, sandboxing, dan resource limits sudah dirancang.
- Collaboration real-time setelah conflict resolution, permission model, dan WebSocket architecture tersedia.

## Invariants keamanan

- Jangan memindahkan token ke URL, log, DOM, atau error response.
- Jangan menghapus ownership predicate `user_id`.
- Jangan mempercayai project/folder ID atau user ID dari client untuk authorization.
- Semua input workflow tetap divalidasi server-side dan dibatasi ukuran/jumlahnya.
- Dynamic user data di frontend dirender sebagai text/DOM nodes, bukan HTML interpolation.
- Pertahankan OAuth state validation, CORS allowlist, JWT algorithm restriction, request limit, dan security headers.
- Temuan yang masih deferred: JWT localStorage, OAuth implicit flow, CSP/SRI, rate limiting login, dan automated security coverage. Jangan memperburuknya secara diam-diam.

## Acceptance gates

Setiap phase hanya dianggap selesai jika:

- demo mode dan login mode tetap berfungsi;
- API contract dan workflow format kompatibel atau perubahan didokumentasikan;
- project/folder ownership test lulus;
- import/export, autosave, reload, dan mobile UI diuji;
- syntax/static checks dan Docker smoke test lulus;
- perubahan terdokumentasi di `docs/CHANGELOG.md`;
- Codex melakukan review integrasi sebelum merge/push.

## Pembagian tanggung jawab

OpenCode mengerjakan backend, schema, API, service/repository, persistence protocol, security, dan migration support. Antigravity mengerjakan browser UI, dashboard, builder interaction, visual states, accessibility, dan frontend integration. Codex mengaudit hasil gabungan, menjalankan regression/security checks, dan mengoreksi masalah lintas-agent.
