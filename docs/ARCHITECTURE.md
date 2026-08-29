# FlowGram Architecture

FlowGram is a static HTML/vanilla JavaScript workflow builder with a Hono serverless API on Vercel and Neon PostgreSQL persistence.

## Runtime

```text
Browser pages -> frontend IIFE modules -> /api/* -> Hono -> services -> repositories -> Neon
      |                  |                                  |
 localStorage       demo/login modes                    Google userinfo + JWT
```

Active pages are `index.html`, `builder.html`, `onboarding.html`, and `auth/google-callback.html`. Active browser code is under `frontend/`; CSS and images are served from `public/`.

## Frontend modules

- `frontend/core/auth/auth.js`: token/cache handling, demo mode, auth gate, OAuth popup and one-time state validation.
- `frontend/core/persistence/shared.js`: `window.FG`, localStorage CRUD, API wrapper, legacy migration, and demo migration.
- `frontend/dashboard/dashboard.controller.js`: project/folder dashboard, search, settings, profile, and optimistic API adapter.
- `frontend/builder/builder.controller.js`: canvas, nodes, connections, viewport, history, import/export, and autosave.
- `frontend/onboarding/onboarding.controller.js`: display-name submission.

Scripts are loaded in dependency order: persistence, auth, then page controller.

## Backend MVC

`api/index.js` only composes routes. Controllers translate HTTP requests, services enforce business rules, repositories contain parameterized SQL, models normalize/validate data, and middleware handles JWT, CORS, request limits, and errors.

Authenticated queries use the verified JWT `userId` and ownership predicates. Project folder references are checked against the same user before writes. Workflow JSON is validated server-side and request `Content-Length` is limited to 4 MiB.

## Persistence modes

Demo mode uses the `demo` sentinel and localStorage keys such as `wf_projects_index`, `wf_folders`, and `wf_project_<id>`. Login mode uses a 30-day application JWT in `fg_token`, API calls, and Neon. JWT localStorage remains a known hardening item; CSP/SRI and cookie-session migration are not yet implemented.

## Deployment

`vercel.json` rewrites `/api/(.*)` to `api/index.js` and adds baseline security headers. Runtime secrets are `DATABASE_URL`, `JWT_SECRET`, Google credentials, and optional `ALLOWED_ORIGINS`. No database schema or automated test suite is stored in the repository.
