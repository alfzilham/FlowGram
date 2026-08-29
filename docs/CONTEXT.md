# FlowGram Context

FlowGram is a personal visual workflow builder. It uses HTML/CSS, vanilla browser IIFEs, Hono 4.7 on Vercel Functions, Neon PostgreSQL, Google OAuth, and `jsonwebtoken`.

## Active structure

- `frontend/`: auth, persistence, dashboard, builder, and onboarding controllers.
- `public/`: CSS and static assets.
- `api/`: configuration, middleware, controllers, services, repositories, models, validators, and database pool.
- `auth/google-callback.html`: OAuth popup callback.
- Root HTML pages: dashboard, builder, onboarding.

Demo mode is local-only through localStorage and the `demo` sentinel. Login mode validates an application JWT and persists projects/folders/workflows through the API. The database is the cloud source of truth; dashboard arrays are optimistic until reload.

Required backend configuration: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`, `JWT_SECRET`; `ALLOWED_ORIGINS` is recommended in deployment. The frontend has no build step. Use a static HTTP server or `vercel dev`.

Security invariants: never trust client user IDs; preserve JWT ownership predicates; validate workflow data before persistence; preserve OAuth state validation, CORS allowlisting, and the request-size guard.
