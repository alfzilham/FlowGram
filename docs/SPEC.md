# FlowGram Specification

FlowGram lets a visitor or authenticated user create visual projects containing positioned, styled, connected nodes.

## Functional contract

- Demo mode uses localStorage without an account.
- Login uses Google OAuth, application JWT (30 days), onboarding name update, project/folder CRUD, and account deletion.
- Builder supports dynamic node editing (`width: auto`), connections, selection, drag/pan/zoom, undo/redo, clipboard, JSON import/export, and debounced autosave.
- Public workflow export remains `{ nodes, connections }`; viewport is not exported.

## API contract

`POST /api/auth/google` is public. `/auth/me`, `/auth/name`, `/auth/account`, all project routes, and all folder routes require Bearer JWT. Project/folder access is scoped to the authenticated `userId`; folder references are ownership-checked before project writes.

## Validation contract

Server validation enforces object types, project/folder name limits, allowed colors, archive types, workflow node/connection limits, unique IDs, valid connection references/sides, bounded finite coordinates, text limits, and a 2 MiB serialized workflow limit. API requests with declared bodies over 4 MiB receive 413.

## Known limitations

There is no automated test suite or checked-in database schema. JWT remains in localStorage; CSP, SRI, refresh/revocation, conflict resolution, and persistent autosave failure indicators are future hardening work.
