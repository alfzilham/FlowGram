# FlowGram Context

FlowGram is a personal visual workflow builder. It uses HTML/CSS, vanilla browser IIFEs, Hono on Node.js, Neon PostgreSQL, Google OAuth, and `jsonwebtoken`.

## Active structure

- `frontend/`: auth, persistence, dashboard, builder, and onboarding controllers.
- `public/`: CSS and static assets.
- `api/`: configuration, middleware, controllers, services, repositories, models, validators, and database pool.
- `auth/google-callback.html`: OAuth popup callback.
- Root HTML pages: dashboard, builder, onboarding.

Demo mode is local-only through localStorage and the `demo` sentinel. Login mode validates an application JWT and persists projects/folders/workflows through the API. The database is the cloud source of truth; dashboard arrays are optimistic until reload.

Required backend configuration: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`, `JWT_SECRET`; `ALLOWED_ORIGINS` is recommended in deployment. The frontend and API are served together by `server/index.js` using `npm start` or `npm run dev`.

For a new Neon database, run `node --env-file=.env.local scripts/init-db.js` once. The schema initializer is idempotent and creates `users`, `folders`, `projects`, and ownership indexes without dropping data.

Security invariants: never trust client user IDs; preserve JWT ownership predicates; validate workflow data before persistence; preserve OAuth state validation, CORS allowlisting, and the request-size guard.
