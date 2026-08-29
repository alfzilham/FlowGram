# Security Audit Report

## 1. Executive Summary

This read-only audit reviewed the repository implementation, configuration, browser code, API handlers, database access, authentication flow, dependency lockfile, deployment routing, and project documentation. The application has a small and understandable attack surface, and several important controls are present: authenticated API operations derive the user identity from a verified JWT, project/folder queries generally include an ownership predicate, SQL values are parameterized, and most ordinary user-visible text is rendered with `textContent`.

The main security concern is frontend trust around HTML construction. User-controlled folder names, project names embedded in menu labels, and the move-folder search value reach `innerHTML` without encoding. This is a confirmed DOM/stored XSS condition. Because the application stores its JWT in `localStorage`, successful XSS can also expose the application bearer token and act as the victim until token expiry or replacement.

The OAuth implementation has two separate weaknesses: no OAuth `state`/nonce correlation is generated or checked, and the fallback path places a Google access token in a query parameter. The first enables a credible login-CSRF/account-confusion flow; the second exposes a bearer token to URL history and potentially request logs. Neither finding demonstrates takeover of a victim's Google account, but both weaken the authentication boundary.

### Finding count

| Severity      | Count |
| ------------- | ----: |
| Critical      |     0 |
| High          |     0 |
| Medium        |     3 |
| Low           |     4 |
| Informational |     2 |

The counts include findings classified as Confirmed, Potential, or Needs Verification. No destructive runtime testing, production testing, dependency installation, or external-system testing was performed. The database schema, deployed headers, production environment, and actual Google/Vercel runtime were not available, so some conclusions remain conditional.

## 2. Project Overview

### Verified architecture

FlowGram is a static, multi-page vanilla HTML/CSS/JavaScript application. `index.html` is the project dashboard, `builder.html` is the canvas editor, `onboarding.html` collects the display name, and `auth/google-callback.html` processes the Google OAuth fragment. Browser scripts are IIFEs loaded in this order on the main pages: `js/shared.js`, `js/auth.js`, then the page controller (`js/home.js` or `js/main.js`).

The backend is a Hono application in `api/index.js`, exposed through Vercel's rewrite in `vercel.json`. `api/_db.js` creates a Neon serverless PostgreSQL pool from `DATABASE_URL`. The API signs application JWTs with `JWT_SECRET` and uses the Google userinfo endpoint to validate the submitted Google bearer token.

### Authentication and modes

- The browser stores the application JWT as `fg_token` in `localStorage` and cached profile data as `fg_user`.
- Demo mode is represented by the literal token value `demo`; it uses localStorage project/index/folder data and does not call authenticated API methods.
- Login mode sends `Authorization: Bearer <application JWT>` to the API.
- `POST /api/auth/google` accepts a Google access token, calls Google's userinfo endpoint, finds or creates a user by `profile.sub`, and returns a 30-day application JWT.
- New users are redirected to onboarding; the name is then updated through `POST /api/auth/name`.

### Persistence and workflow data

Demo data uses `wf_projects_index`, `wf_folders`, and `wf_project_<id>` localStorage keys. Authenticated projects store metadata and JSON workflow data in Neon. A workflow contains `nodes`, `connections`, and a `viewport`; exported JSON currently contains only `nodes` and `connections`.

### Documentation discrepancies relevant to security

The repository contains root documentation and a `docs/` copy. The implementation, rather than those documents, is treated as authoritative. The source confirms the documented ownership checks for project/folder operations, but it also shows undocumented details that matter to security: the OAuth fallback query token, multiple `innerHTML` concatenations, and lack of server-side validation for folder relationships and workflow structure.

## 3. Audit Scope

Reviewed:

- `api/index.js`, `api/_db.js`.
- `js/auth.js`, `js/shared.js`, `js/home.js`, `js/main.js`, `js/onboarding.js`.
- `index.html`, `builder.html`, `onboarding.html`, `auth/google-callback.html`.
- `vercel.json`, `.gitignore`, `package.json`, `package-lock.json`.
- `README.md`, root architecture/context/spec/design documents, and `docs/DIRECTORY.md`.
- CSS files where they affect CSP/inline behavior, responsive security UX, or rendering assumptions.
- All repository files outside `node_modules/` and `.git/` identified by repository file enumeration.

Security domains covered:

- Authentication, OAuth, JWT/session handling, onboarding, logout, and demo separation.
- Authorization, object ownership, IDOR, folder/project tenant boundaries, and account deletion.
- API parsing, input validation, mass assignment, error handling, and abuse/resource controls.
- SQL/database access, serialization, transactions, and external server-side requests.
- DOM XSS and user-controlled data flows.
- localStorage, CORS, CSRF, browser security headers, and deployment routing.
- Secrets/configuration, dependency declarations/lockfile, import/export, and business logic.

## 4. Methodology

The audit followed a source-led OWASP/WSTG-style review:

1. Enumerated repository files while excluding vendored `node_modules` and Git internals from application analysis.
2. Read the supplied documentation and compared its claims with the HTML, JavaScript, API, package, and Vercel configuration.
3. Traced request data from HTTP input through authentication, route handlers, SQL queries, and returned data.
4. Reviewed every API route for authentication and ownership predicates.
5. Searched for security-sensitive constructs including JWT, `Authorization`, `user_id`, SQL queries, `fetch`, localStorage, `innerHTML`, redirects, URL parsing, environment variables, and external services.
6. Traced user-controlled project/folder/node/import values into DOM sinks and inspected whether `textContent`, attributes, or HTML concatenation was used.
7. Reviewed OAuth state handling, token transport, token storage, expiration, and logout.
8. Reviewed dependency versions as pinned by `package-lock.json`; no live advisory lookup or package installation was performed.
9. Performed non-destructive local syntax validation with `node --check` for all JavaScript files. No live API/database/OAuth environment was available for safe runtime validation.
10. Challenged suspected findings against the actual data flow and downgraded issues where exploitability depended on unavailable deployment or schema information.

## 5. Attack Surface

### Public and browser entry points

- `/index.html`: public dashboard shell and auth gate; loads third-party Bootstrap Icons, Google Fonts, Lucide, and app scripts.
- `/builder.html?id=<project-id>`: builder shell; the query parameter selects the project and is used in a same-origin API/localStorage lookup.
- `/onboarding.html`: display-name form for a non-demo token.
- `/auth/google-callback.html`: OAuth fragment parser and fallback redirect.
- Static `/api` rewrite: all backend route handlers in `api/index.js`.

### API endpoints

Unauthenticated login exchange:

- `POST /api/auth/google` — receives `googleToken`, calls Google userinfo, creates/loads user, signs JWT.

JWT-protected authentication/account routes:

- `GET /api/auth/me`
- `POST /api/auth/name`
- `DELETE /api/auth/account`

JWT-protected project routes:

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

JWT-protected folder routes:

- `GET /api/folders`
- `POST /api/folders`
- `PUT /api/folders/:id`
- `DELETE /api/folders/:id`

### User-controlled data flows

- Google access token → callback fragment → opener callback or `google_token` query → `/api/auth/google`.
- Project/folder names → API/localStorage → dashboard DOM and context menus.
- Folder search query → `innerHTML` in the create-folder suggestion.
- Node text/import data → builder state → node text uses `textContent`; imported icon names become attributes and are not directly HTML.
- Project ID query parameter → project lookup/API path and redirect behavior.
- JWT/user profile → localStorage and Authorization header.
- JSON body → `JSON.stringify` into `projects.data` and later JSON parsing/rendering.

### External services

- Server-side `fetch` from the API to `https://www.googleapis.com/oauth2/v3/userinfo`.
- Browser-side Google OAuth authorization endpoint.
- Browser-side Google Fonts, Bootstrap Icons CDN, and Lucide UMD CDN.

## 6. Security Strengths

- `verifyJWT` rejects absent, malformed, or invalidly signed tokens and uses `jwt.verify`, not merely payload decoding (`api/index.js:11-23`).
- Authenticated project list/get/update/delete queries include `user_id = $...` ownership checks (`api/index.js:120-128`, `152-157`, `186-190`, `199-201`).
- Authenticated folder list/update/delete queries include `user_id` checks (`api/index.js:209-214`, `245-249`, `258-259`).
- Account deletion uses the JWT subject (`payload.userId`) rather than a client-supplied user ID (`api/index.js:104-112`).
- SQL values are parameterized throughout the database calls. The dynamic project/folder update statement interpolates only internally selected fixed column names; user values remain positional parameters (`api/index.js:164-190`, `237-249`).
- The Google identity lookup uses the provider subject `profile.sub`, not a user-controlled email as the account key (`api/index.js:41-58`).
- Normal project names, folder names in the sidebar, node text, toast messages, and most profile fields use `textContent` rather than HTML parsing (`js/home.js:420`, `582`, `658`, `js/main.js:344`, `js/auth.js:167`).
- The builder's URL `id` is used as a lookup/path value, not evaluated as script, and no `eval`, `Function`, or `insertAdjacentHTML` usage was found.
- The API does not expose a user ID parameter for CRUD authorization decisions; identity comes from the verified JWT payload.

## 7. Security Findings

### [FG-001] User-controlled values reach HTML sinks, enabling stored and DOM XSS

- Status: Confirmed
- Severity: Medium
- Confidence: High
- Category: XSS / unsafe DOM construction
- CWE: CWE-79
- OWASP: A03:2021 Injection
- Affected File: `js/home.js`
- Class/Function/Method: `openCtxMenu`, `renderMoveFolderList`, `renderFolders`
- Line/Code Reference: `js/home.js:99`, `js/home.js:241`, `js/home.js:255`, `js/home.js:627`

#### Evidence

`openCtxMenu` creates a button with `btn.innerHTML = item.icon + '<span>' + item.label + '</span>'` at `js/home.js:99`. `item.label` is not universally constant: project delete labels incorporate `meta.name` at `js/home.js:337`, and folder actions can incorporate `f.name` through the move/context menu paths.

`renderMoveFolderList` inserts a folder name directly into HTML at `js/home.js:241`:

```js
item.innerHTML = iconSvg(...) + '<span>' + f.name + '</span>';
```

The same function inserts the live search value into HTML at `js/home.js:255`:

```js
createItem.innerHTML = iconSvg(...) + '<span>Buat folder "<strong>' + query + '</strong>"</span>';
```

The expanded folder project list inserts a project name at `js/home.js:627`:

```js
pItem.innerHTML = iconSvg(...) + '<span class="folder-project-name">' + p.name + '</span>';
```

Folder/project names can originate from user input and from the API/localStorage. There is no HTML encoder or sanitizer around these concatenations. The search path is reachable by simply typing a crafted value into the move-folder search input; the stored paths are reachable after a crafted folder/project name is saved and later rendered.

#### Root Cause

The dashboard mixes trusted static SVG/menu markup with untrusted application data in the same `innerHTML` string. The code relies on the value being a normal name, but names and search input are not constrained to a safe HTML grammar by the client or server.

#### Attack Scenario

1. An attacker who can create or rename a folder/project supplies an HTML event-handler payload as its name, or an attacker with access to the victim's dashboard types a payload into the move-folder search box.
2. The dashboard calls `renderMoveFolderList`, expands a folder, or opens a context menu containing that value.
3. The browser parses the value as markup and executes an event handler in the FlowGram origin.
4. The script can read `localStorage.fg_token`, issue same-origin requests as the victim, alter/delete projects, or exfiltrate data to an attacker-controlled endpoint. The search-input variant does not require persistence; the stored-name variants do.

#### Impact

Confidentiality and integrity impact is meaningful for authenticated users: workflow contents and profile/session data can be read or modified, and the bearer JWT can be stolen. Availability impact includes deletion or corruption of the victim's projects. The practical impact is amplified because the JWT is stored in localStorage (see FG-005).

#### Recommended Remediation

Build menu rows with DOM APIs and assign untrusted values through `textContent`/`createTextNode`. Keep static SVG markup separately, or create SVG elements without concatenating user data. For every menu label that needs a dynamic name, create a separate text node. Add server-side length/type validation for names as defense in depth, but do not treat validation as HTML encoding.

#### Regression Risk

Replacing HTML templates may alter icon rendering, spacing, or event delegation. Dynamic labels with quotes/Unicode may expose assumptions in CSS or truncation. Regression testing must cover project/folder names, context menus, mobile sheets, rename dialogs, and the move-folder search flow.

#### Verification Method

Use harmless test strings such as `<img src=x onerror=alert(document.domain)>` in a folder name, project name, and move-folder search field. Confirm the string displays literally and no handler executes in dashboard, context menu, expanded folder, and mobile sheet views. Inspect the DOM to ensure the payload is a text node, then repeat after reload and through API-backed data.

### [FG-002] OAuth callback lacks state/nonce correlation, enabling login CSRF/account confusion

- Status: Confirmed
- Severity: Medium
- Confidence: High
- Category: Authentication / OAuth flow
- CWE: CWE-352 (login CSRF aspect)
- OWASP: A07:2021 Identification and Authentication Failures
- Affected File: `js/auth.js`, `auth/google-callback.html`
- Class/Function/Method: `handleGoogleAuth`, `window.__fgAuthCallback`, callback IIFE
- Line/Code Reference: `js/auth.js:75-94`, `js/auth.js:96-132`; `auth/google-callback.html:42-65`

#### Evidence

`handleGoogleAuth` constructs the Google authorization URL with `client_id`, `redirect_uri`, `response_type=token`, and scope, but no `state` or nonce is generated or stored (`js/auth.js:75-94`). The callback page reads any `access_token` from the fragment and calls `window.opener.__fgAuthCallback(accessToken)` without checking that the flow was initiated by the current browser context (`auth/google-callback.html:43-48`). `__fgAuthCallback` exchanges that token and stores the returned application JWT (`js/auth.js:96-104`).

#### Root Cause

The implementation authenticates the provider token but does not bind the callback response to an authorization request initiated by the same user session/browser context. Provider token validity is not a substitute for OAuth transaction correlation.

#### Attack Scenario

1. An attacker initiates Google OAuth for the attacker's own Google account and obtains a valid callback token/URL.
2. The attacker causes a victim to visit or complete the callback flow without a matching state value, or otherwise supplies the callback to the victim's browser.
3. The callback accepts the attacker's valid provider token and the app stores a JWT for the attacker's FlowGram account in the victim's browser.
4. The victim may create or edit workflows believing they are using their own account, while requests are sent to the attacker's account. This is account confusion and can cause data disclosure to the attacker; it is not evidence that the victim's Google credentials are stolen.

#### Impact

Authentication integrity and data confidentiality are affected. The victim can be silently bound to the wrong FlowGram identity and submit workflow/profile data to that identity. Severity is Medium because the attack requires convincing the victim to follow/complete an attacker-controlled authentication flow and does not directly forge a JWT.

#### Recommended Remediation

Use an OAuth authorization-code flow with PKCE where practical, or at minimum generate a cryptographically random state value per login attempt, store it in a short-lived same-site transaction cookie/session, and require an exact match in the callback before exchanging the provider result. Use a nonce when an ID token is used and validate issuer, audience, expiry, and nonce. Do not accept unsolicited callback tokens.

#### Regression Risk

Popup and fallback behavior can break if state storage is scoped incorrectly, if third-party-cookie restrictions prevent the callback from reading the transaction, or if multiple concurrent login tabs overwrite one state. The design must support multiple outstanding attempts and preserve demo-to-login migration behavior.

#### Verification Method

Start a login, capture the generated state, then replay the callback with a missing, altered, expired, and state-from-another-tab value; all must be rejected without changing `fg_token`. Complete a valid same-tab flow and verify it succeeds. Test popup-closed, direct callback, and demo migration cases.

### [FG-003] OAuth access token is placed in a query string on the fallback path

- Status: Confirmed
- Severity: Medium
- Confidence: High
- Category: Sensitive token exposure / session handling
- CWE: CWE-598
- OWASP: A07:2021 Identification and Authentication Failures
- Affected File: `auth/google-callback.html`, `js/auth.js`
- Class/Function/Method: callback fallback, query-token bootstrap IIFE
- Line/Code Reference: `auth/google-callback.html:62-65`; `js/auth.js:135-139`

#### Evidence

When no usable opener callback exists, the callback page executes:

```js
window.location.href = "/?google_token=" + encodeURIComponent(accessToken);
```

at `auth/google-callback.html:62-65`. The root page then reads the token from `window.location.search` at `js/auth.js:136` and invokes the exchange. Although `history.replaceState` removes it after script execution, the token has already been placed in the URL and the initial request to `/` contains the query string.

#### Root Cause

A bearer credential is transported through a URL query parameter rather than remaining in a fragment, a same-origin callback channel, or a server-side code exchange. URL values can be retained in browser history, proxy/Vercel access logs, screenshots, copied links, and same-origin telemetry/referrer contexts.

#### Attack Scenario

If the popup opener is absent or blocked, the callback redirects to a URL containing the Google access token. Anyone with access to browser history, origin request logs, copied URLs, or a compromised same-origin logging component may recover and replay the token while it remains valid. The direct external Google authorization response is a fragment, but this fallback explicitly converts it to a query string.

#### Impact

Exposure of the Google bearer token can allow access to the Google userinfo exchange and issuance of a FlowGram JWT while the token remains valid. The precise lifetime and provider scope are not established from repository code, so impact is bounded but real. This finding is separate from the application JWT localStorage risk.

#### Recommended Remediation

Remove the query-string fallback. Prefer a code+PKCE flow handled by the backend, or use a strictly origin-checked `postMessage`/popup channel with a state-bound transaction. If a temporary URL bootstrap is unavoidable, keep the credential in a fragment, consume it immediately, apply a restrictive `Referrer-Policy`, and never log or render it; a code rather than a bearer token is preferable.

#### Regression Risk

Users with popup blockers or browsers that do not preserve `window.opener` may lose the fallback login path. A replacement must explicitly test popup, redirect, mobile, private browsing, and multi-tab flows.

#### Verification Method

Run login with opener unavailable and verify no URL, browser history entry, server request, or redirect contains an access token. Confirm successful login through the replacement flow and inspect Vercel/proxy logs for absence of credentials.

### [FG-004] Project APIs accept folder IDs without validating folder ownership or relationship

- Status: Potential
- Severity: Low
- Confidence: High
- Category: Authorization / tenant data integrity
- CWE: CWE-863 (improper authorization, relationship validation aspect)
- OWASP: A01:2021 Broken Access Control
- Affected File: `api/index.js`
- Class/Function/Method: project create/update handlers
- Line/Code Reference: `api/index.js:133-145`, `api/index.js:164-190`

#### Evidence

`POST /api/projects` accepts `body.folderId` and writes it into `projects.folder_id` without querying whether that folder belongs to `payload.userId` (`api/index.js:133-145`). `PUT /api/projects/:id` likewise accepts `body.folderId` and updates the owned project without validating the target folder (`api/index.js:164-190`). Folder CRUD itself does enforce folder ownership, but that does not enforce the cross-table relationship.

#### Root Cause

The handler authorizes the project row but treats a client-supplied foreign identifier as a valid relationship. Tenant isolation is enforced at row reads, not at relationship writes.

#### Attack Scenario

An authenticated user who learns or guesses another user's folder ID submits it as `folderId` when creating or updating their own project. The project can then contain a cross-user folder reference. Current list queries still filter projects by the authenticated `user_id`, so the source proves a tenant-integrity violation but not direct disclosure of the other user's folder or project.

#### Impact

The immediate impact is cross-tenant referential contamination and inconsistent data. Based on the visible queries, this does not by itself grant User A access to User B's project. Exploitability depends on obtaining a target folder ID; the ID format and database constraints are not enough to prove practical enumeration.

#### Recommended Remediation

When `folderId` is non-null, validate it with a query scoped to `folders.id = $folderId AND folders.user_id = $payload.userId`, or update through a transaction/foreign-key design that enforces the same invariant. Reject nonexistent or foreign folder IDs with a consistent 400/404 response. Apply the same check on create and update.

#### Regression Risk

Existing records created by the current behavior may contain invalid/cross-user IDs and would need a migration or cleanup policy. Client-side optimistic creation must handle a rejected folder assignment without leaving a phantom project.

#### Verification Method

With two test accounts, obtain a folder ID in a controlled test environment, then attempt create/update from the other account. Expect rejection and verify no row is changed. Test null/root assignment and valid same-user assignment. Query for existing cross-user relationships as a one-time integrity check.

### [FG-005] Bearer JWT and cached profile are stored in localStorage

- Status: Informational
- Severity: Low
- Confidence: High
- Category: Client-side session storage
- CWE: CWE-922
- OWASP: A07:2021 Identification and Authentication Failures
- Affected File: `js/auth.js`, `js/shared.js`, `js/onboarding.js`
- Class/Function/Method: token management and API wrapper
- Line/Code Reference: `js/auth.js:18-39`, `js/auth.js:59-70`; `js/shared.js:215-226`; `js/onboarding.js:6-11`

#### Evidence

`setToken` writes the application JWT to `localStorage` key `fg_token`, and `saveUser` writes profile data to `fg_user` (`js/auth.js:18-39`). The API wrapper reads `fg_token` and puts it in the Authorization header (`js/shared.js:215-226`). Onboarding also reads the same token directly (`js/onboarding.js:6-11`). No HttpOnly cookie session is used.

#### Root Cause

The browser application chooses a JavaScript-readable persistent token store. This is an architectural tradeoff, not automatically a vulnerability; it becomes high impact when any same-origin XSS or compromised script can execute.

#### Attack Scenario

An attacker first needs same-origin script execution, such as FG-001, or a malicious/compromised third-party script loaded by the page. That script can read `fg_token`, replay it from another client, and call authenticated API routes until expiry or token invalidation.

#### Impact

The storage choice amplifies XSS from a page-level script injection to a reusable bearer credential. It also persists authentication across browser restarts. There is no evidence of a separate localStorage-only bypass without script execution.

#### Recommended Remediation

Use a secure, HttpOnly, Secure, SameSite cookie for the application session, with CSRF protection appropriate to the cookie model, or use a short-lived access token held in memory with a refresh strategy. Regardless of storage choice, fix DOM XSS and reduce third-party script trust.

#### Regression Risk

Moving to cookies changes CORS, CSRF, logout, local development, popup callback, and API client behavior. It can also break demo mode and onboarding unless both modes are explicitly separated.

#### Verification Method

After any session redesign, confirm JavaScript cannot read the session cookie, cross-site state-changing requests are rejected, logout invalidates the session, token expiry is enforced, and all authenticated pages/API calls still work.

### [FG-006] No server-side size/shape limits are visible for workflow JSON

- Status: Potential
- Severity: Low
- Confidence: Medium
- Category: Input validation / resource exhaustion
- CWE: CWE-400
- OWASP: A04:2021 Insecure Design
- Affected File: `api/index.js`, `js/main.js`
- Class/Function/Method: project create/update, import handler
- Line/Code Reference: `api/index.js:133-145`, `164-190`; `js/main.js:888-917`

#### Evidence

The API parses arbitrary JSON bodies and, when `body.data` is supplied, stores `JSON.stringify(body.data)` and derives only `body.data.nodes?.length` (`api/index.js:133-145`, `176-181`). There are no visible limits on body bytes, node/connection array lengths, string lengths, coordinate ranges, nesting, or unexpected properties. The browser import handler accepts any JSON with an array-valued `nodes` field and assigns `data.nodes`/`data.connections` directly (`js/main.js:901-911`).

#### Root Cause

The workflow is treated as an opaque JSON blob with minimal structural validation. The API and browser do not establish a resource budget before persistence/rendering.

#### Attack Scenario

An authenticated user submits a very large workflow body or imports a JSON file containing large arrays, long strings, or many invalid connections. The API may consume database/storage resources; the browser may spend excessive time constructing DOM/SVG nodes and paths. The visible code does not demonstrate cross-tenant impact, so this is not classified as a confirmed global DoS.

#### Impact

Potential availability degradation, database/storage bloat, slow page loads, and malformed graph state. Impact depends on Vercel request limits, Neon limits, and deployment quotas not visible in the repository.

#### Recommended Remediation

Define and enforce a schema at the API boundary: maximum request/body size, node/connection counts, bounded strings, finite coordinates, permitted colors/icons/sides, valid node references, and rejection of unknown or deeply nested structures. Apply equivalent client validation for user feedback, but keep server validation authoritative. Consider rate limits and per-user quotas.

#### Regression Risk

Existing large or legacy workflows may be rejected. Limits need to be chosen from actual product requirements, with a migration/error UX for invalid saved data and a clear response for oversized imports.

#### Verification Method

Test boundary values and malformed types for every field, invalid connection references, oversized arrays/strings/files, deep objects, NaN/Infinity representations, and unknown properties. Confirm 4xx responses before database writes and bounded browser rendering time.

### [FG-007] OAuth provider claims are only partially constrained by application code

- Status: Needs Verification
- Severity: Low
- Confidence: Medium
- Category: Federated authentication validation
- Affected File: `api/index.js`
- Class/Function/Method: `POST /api/auth/google`
- Line/Code Reference: `api/index.js:33-72`

#### Evidence

The server sends the submitted Google bearer token to Google's userinfo endpoint and uses `profile.sub`, `profile.email`, `profile.name`, and `profile.picture` (`api/index.js:33-42`). The source does not explicitly check `email_verified`, issuer, audience, or token expiry itself. It relies on the response from the userinfo endpoint. No Google OAuth runtime/configuration or provider behavior was available to establish whether the accepted userinfo response is always sufficient for the intended account policy.

#### Root Cause

Federated identity policy is implicit in the upstream userinfo call rather than explicitly enforced and documented by the application.

#### Attack Scenario

This cannot be elevated from source alone to account takeover. If an accepted Google userinfo response could represent an unverified or wrong-audience identity under the deployed client configuration, the application might provision an account under an identity it should reject. The risk requires provider/configuration conditions not available here.

#### Impact

Potential improper account provisioning or weak identity assurance. `profile.sub` reduces the risk of simple email-claim spoofing, and no direct JWT forgery path was found.

#### Recommended Remediation

Use Google's supported server-side token verification/introspection approach and explicitly enforce issuer, audience/client ID, expiry, and the application's email-verification policy. Keep provider validation server-side and log only non-sensitive identifiers.

#### Regression Risk

Existing users with profiles missing a verified-email flag may be rejected or require a migration. Multiple Google client IDs/environments must be handled explicitly.

#### Verification Method

Use controlled Google test credentials and negative provider tokens for wrong audience, expired, revoked, malformed, and unverified identities. Verify no application JWT is issued for rejected claims.

### [FG-008] Security response headers and third-party script integrity are not configured in the repository

- Status: Needs Verification
- Severity: Informational
- Confidence: High
- Category: Browser/deployment hardening
- Affected File: `vercel.json`, `index.html`, `builder.html`
- Class/Function/Method: deployment configuration and script tags
- Line/Code Reference: `vercel.json:1-5`; `index.html:579-582`; `builder.html:235-238`

#### Evidence

`vercel.json` defines only an API rewrite and no `headers` section. The pages load scripts from `https://unpkg.com/lucide@latest/...` and CSS/CDN resources without visible Subresource Integrity attributes (`index.html:579-582`; `builder.html:235-238`). The repository contains no visible CSP, HSTS, `X-Content-Type-Options`, frame protection, or referrer policy configuration. Actual Vercel/platform headers were not available for verification.

#### Root Cause

Security policy is left to platform defaults and mutable third-party CDN resources, with no repository-enforced baseline.

#### Attack Scenario

This is not a confirmed exploitable vulnerability without deployed response headers. A compromised CDN path or unexpected inline/script requirement could increase XSS impact; missing CSP also removes a defense-in-depth control against future DOM injection.

#### Impact

Reduced defense in depth and supply-chain resilience. The code currently needs inline scripts/styles in some pages, so a CSP would require deliberate nonce/hash design.

#### Recommended Remediation

Inventory actual production headers, then define a restrictive CSP compatible with the application, explicit `Referrer-Policy`, `frame-ancestors`/frame protection, `X-Content-Type-Options`, and HSTS when HTTPS-only. Pin CDN versions, add SRI where practical, or self-host trusted assets.

#### Regression Risk

An over-restrictive CSP can break Google OAuth, Google Fonts, Lucide, inline styles/scripts, SVG rendering, or popup behavior. Roll out in report-only mode first and test every page.

#### Verification Method

Inspect deployed responses with a header tool/browser DevTools, then use CSP report-only and verify no unexpected external origin, inline execution, framing, or referrer leakage remains.

### [FG-009] CORS is broadly configured, but no direct CSRF bypass was demonstrated

- Status: Informational
- Severity: Informational
- Confidence: High
- Category: CORS / browser request policy
- Affected File: `api/index.js`
- Class/Function/Method: Hono global middleware
- Line/Code Reference: `api/index.js:8`

#### Evidence

The API applies `cors({ origin: '*', credentials: true })` to all routes at `api/index.js:8`. Authenticated browser requests use an `Authorization` header rather than cookies (`js/shared.js:222`, `js/auth.js:47-49`). No cookie session or CSRF token was found.

#### Analysis

The configuration is broader than necessary and may be invalid/inconsistent for credentialed cross-origin browser requests depending on the Hono/browser combination, but wildcard CORS does not by itself let an attacker obtain a victim's bearer-authenticated response. A cross-origin attacker still needs the victim's Authorization token, and the browser does not automatically attach localStorage tokens to another origin. Therefore this is not reported as a confirmed CSRF or IDOR issue.

#### Recommended Remediation

Allow only the deployed frontend origin(s), set credentials according to the chosen cookie/token model, and explicitly handle preflight methods/headers. If cookies are introduced, add CSRF defenses and test cross-origin state-changing requests.

#### Regression Risk

Restricting origins can break local development, preview deployments, OAuth callback pages, or future multi-origin clients. Make the allowlist environment-aware.

#### Verification Method

Test preflight and actual requests from an allowed origin, an untrusted origin, with and without Authorization, and with cookies if introduced. Confirm untrusted origins cannot read responses or trigger state-changing actions.

## 8. Risk Summary

| ID     | Severity      | Confidence | Status             | Category                | Risk                                                                                                |
| ------ | ------------- | ---------- | ------------------ | ----------------------- | --------------------------------------------------------------------------------------------------- |
| FG-001 | Medium        | High       | **Fixed**          | XSS                     | User-controlled names/search reach `innerHTML`; authenticated DOM XSS and token theft are possible. |
| FG-002 | Medium        | High       | **Fixed**          | OAuth                   | Missing state/nonce permits login-CSRF/account confusion.                                           |
| FG-003 | Medium        | High       | **Fixed**          | Token exposure          | Fallback places a bearer token in URL/query logs/history.                                           |
| FG-004 | Low           | High       | **Fixed**          | Authorization/integrity | Project folder relationships are not checked against folder ownership.                              |
| FG-005 | Low           | High       | Deferred           | Session storage         | localStorage makes any same-origin script compromise a token compromise.                            |
| FG-006 | Low           | Medium     | **Fixed**          | Input/resource limits   | Arbitrary workflow JSON can be persisted/rendered without visible budgets.                          |
| FG-007 | Low           | Medium     | **Fixed**          | Federated auth          | Provider claim policy is implicit and incomplete in source.                                         |
| FG-008 | Informational | High       | **Fixed**          | Headers/supply chain    | No repository-enforced security headers or CDN integrity controls.                                  |
| FG-009 | Informational | High       | **Fixed**          | CORS/CSRF               | Wildcard policy is overbroad, but bearer-header model prevents a demonstrated ambient-token CSRF.   |

## 9. Recommended Remediation

Prioritize in this order:

1. **FG-001 — eliminate unsafe HTML concatenation.** Convert every dynamic dashboard/menu row to DOM construction with `textContent`; add regression coverage for stored names, search input, mobile sheets, and API-loaded values. This is the highest priority because it is directly exploitable and amplifies into session theft.
2. **FG-002 and FG-003 — redesign the OAuth transaction.** Use code + PKCE and server-side exchange if feasible; otherwise add state-bound popup/redirect handling, reject unsolicited callbacks, and remove query-string bearer tokens. Treat this as an authentication flow change with multi-tab and popup regression testing.
3. **FG-004 — enforce folder ownership on relationship writes.** Validate `folderId` against the authenticated user in both create and update, and audit existing rows for cross-user references.
4. **FG-006 — establish workflow schema and resource limits.** Validate server-side before serialization/database writes and before browser rendering. Add per-user quotas/rate limits appropriate for the deployment.
5. **FG-007 — make Google identity policy explicit.** Verify provider claims using the supported verification mechanism and define the accepted audience/issuer/email policy.
6. **FG-008 and FG-009 — harden deployment policy.** Inventory actual headers, add a tested CSP and other response headers, pin third-party assets, and replace wildcard CORS with environment-specific origins.
7. **FG-005 — consider a safer session model after XSS is fixed.** Moving from localStorage to HttpOnly cookies is a separate architecture/security change and must include CSRF, CORS, logout, expiry, and demo-mode design.

The recommendations above are not implemented by this audit. The primary source files remain unchanged.

## 10. Verification Plan

After remediation, developers should validate:

### Unit and component validation

- Test name/label rendering with HTML metacharacters, Unicode, quotes, long strings, and empty values.
- Test workflow schema validators with wrong types, missing fields, unknown fields, invalid references, invalid sides/icons/colors, non-finite coordinates, deep objects, and boundary sizes.
- Test folder relationship validation for null, same-user, nonexistent, and foreign IDs.
- Test JWT helper behavior for missing, malformed, expired, wrong-secret, wrong-audience, and altered claims.

### API authorization and IDOR

- Create controlled User A and User B accounts in a non-production environment.
- Replay every project/folder GET, PUT, and DELETE request with the other user's IDs; expect 404/403 and no state change.
- Attempt project creation/update with a foreign folder ID; expect rejection.
- Verify account deletion affects only the authenticated account and handles partial failure safely.
- Verify client-supplied `userId` fields, if added later, are ignored for authorization.

### Authentication/OAuth

- Test valid, expired, revoked, wrong-audience, malformed, and provider-error responses.
- Test missing/altered/replayed/expired OAuth state, concurrent tabs, popup closure, direct callback, and mobile redirect.
- Confirm no provider or application bearer token appears in URL query strings, browser history, referrers, or access logs.
- Confirm logout removes local state and any server-side session/cookie is invalidated according to the chosen model.

### XSS and import/export

- Test stored, reflected/DOM, and imported payloads in project names, folder names, node text, icon fields, search, settings, toast paths, and context menus.
- Verify imported text is displayed as text and imported icon values are restricted to an allowlist.
- Test malformed connections to ensure they are rejected or safely ignored without crashes or unexpected DOM creation.
- Confirm export/import preserves the intended workflow contract and does not silently accept invalid graph state.

### Browser/deployment controls

- Inspect production and preview response headers for CSP, HSTS, referrer policy, MIME sniffing protection, and frame protection.
- Test CSP report-only before enforcement; verify Google OAuth, fonts, icons, inline code, SVG, and popup behavior.
- Test CORS preflight/actual requests from allowed and untrusted origins with Authorization and cookies.
- Pin and verify third-party asset versions/integrity; test failure behavior when a CDN asset is unavailable.

### Regression and operational validation

- Run `node --check` and any future lint/test/build pipeline.
- Test demo mode, login mode, demo-to-account migration, onboarding, dashboard CRUD, builder autosave, undo/redo, mobile touch behavior, and account deletion.
- Add monitoring for rejected validation, authorization failures, OAuth failures, and save failures without logging tokens, full workflow content, or sensitive profile data.
- Re-run this audit after restructuring and compare route, data, and security-control behavior against this report.

## 11. Audit Limitations

- No production URL, deployed Vercel response headers, CDN configuration, or runtime logs were available.
- No `DATABASE_URL`, `JWT_SECRET`, Google client secret, database schema/migrations, constraints, indexes, or seed data were available. Foreign-key and cascade behavior therefore could not be verified.
- No valid test accounts were supplied; cross-user authorization was assessed statically, not by replaying controlled requests.
- Google OAuth provider behavior, client registration, redirect URI restrictions, token lifetime, and claim semantics were not runtime-tested.
- No Burp Suite proxy, browser automation, or live API testing was used; the audit was repository-static plus JavaScript syntax checks.
- Dependency versions were read from `package.json` and `package-lock.json`. No package installation or live vulnerability database lookup was performed, so no CVE claim is made.
- `node_modules/` exists locally but was treated as vendored/generated dependency content, not as application source. Its complete transitive security posture was not independently verified.
- No schema file exists in the repository, so database constraints and transaction/isolation behavior are unknown.
- The audit did not test destructive actions, load/DoS behavior, production data, third-party systems, or persistence mechanisms.

## 12. Final Security Assessment

FlowGram has a reasonable baseline for a small application: authenticated API routes use verified JWT identity, primary project/folder CRUD queries apply ownership predicates, and SQL injection was not identified in the visible query paths. However, the current codebase is not ready to be treated as production-hardened because the dashboard has a confirmed XSS path, OAuth callback correlation is absent, and the fallback can expose bearer tokens in URLs. These are the highest-priority issues.

Before any MVC restructuring, fix or explicitly track FG-001 through FG-003, define the intended OAuth/session model, and record the database ownership invariant for project-folder relationships. The codebase can be restructured incrementally, but security behavior must be regression-tested at each move. In particular, the future structure must not hide authorization in frontend adapters, move JWT verification out of the API boundary, or accidentally reintroduce HTML concatenation during view extraction.

# Appendix A Codex Prompt for MVC Restructuring

Copy and give the following prompt to a future Codex session only after reviewing this audit:

````text
You are restructuring the existing FlowGram project into a coherent, directory-based MVC-oriented architecture. This is a FUTURE implementation task; first perform reconnaissance and do not move or rewrite files until you understand all dependencies.

PROJECT ROOT
D:\\2026\\Workspace\\PersonalApps\\FlowGram

OBJECTIVE

Incrementally reorganize the current FlowGram codebase while preserving existing behavior, API contracts, workflow data format, deployment compatibility, demo mode, login mode, project/folder behavior, builder functionality, onboarding, and authentication semantics. Minimize regression risk and avoid an uncontrolled rewrite. This task is separate from any security remediation unless a change is explicitly listed, justified, implemented, and verified.

CURRENT VERIFIED ARCHITECTURE

- Static frontend with no bundler/build step: index.html is the dashboard, builder.html is the canvas editor, onboarding.html collects the display name, and auth/google-callback.html handles Google OAuth callback fragments.
- Browser scripts are IIFEs loaded in this order on main pages: js/shared.js, js/auth.js, then js/home.js or js/main.js.
- api/index.js is a Hono app routed through vercel.json /api/(.*) to the same serverless handler.
- api/_db.js creates a Neon Pool from DATABASE_URL.
- js/shared.js exposes window.FG and currently combines localStorage persistence, project/folder CRUD, legacy migration, API calls, and demo-to-account migration.
- js/auth.js manages localStorage keys fg_token and fg_user, Google OAuth popup handling, application JWT exchange, auth gate, demo sentinel token demo, and fg-auth-ready.
- js/home.js owns dashboard rendering, project/folder filters, search, CRUD menus, settings, theme/font, profile UI, and login-mode in-memory API overrides.
- js/main.js owns builder state, nodes, connections, viewport transform, selection, drag/pan/zoom, undo/redo, clipboard, import/export, context menus, mobile sheets, shortcuts, and debounced autosave.
- js/onboarding.js posts the display name to /api/auth/name.
- API routes are:
  - POST /api/auth/google
  - GET /api/auth/me
  - POST /api/auth/name
  - DELETE /api/auth/account
  - GET/POST /api/projects
  - GET/PUT/DELETE /api/projects/:id
  - GET/POST /api/folders
  - PUT/DELETE /api/folders/:id
- Backend identity comes from a verified Bearer JWT payload.userId. Project and folder CRUD queries currently include user_id ownership predicates. Preserve this server-side authorization.
- SQL values are parameterized. Preserve that property.
- Demo persistence keys are wf_projects_index, wf_folders, wf_project_<id>, and legacy wf_builder_state_v1.
- Workflow data is {nodes, connections, viewport}. Nodes contain id, x, y, text, color, icon. Connections contain id, from.nodeId/from.side, to.nodeId/to.side. Public export currently contains nodes and connections only; do not silently change this contract.

TARGET ARCHITECTURE

Use an MVC-oriented structure that respects the fact that the builder is browser-side canvas logic and should not be forced into a textbook server MVC abstraction:

```text
/
├─ api/
│  ├─ index.js                         # thin route composition/entrypoint
│  ├─ config/                          # environment/config access
│  ├─ middleware/                      # auth, CORS, error boundary (preserve semantics)
│  ├─ controllers/                     # HTTP request/response orchestration
│  │  ├─ auth.controller.js
│  │  ├─ project.controller.js
│  │  └─ folder.controller.js
│  ├─ services/                        # auth exchange, project/folder business rules
│  ├─ models/                          # validated domain shapes/serialization
│  ├─ repositories/                    # Neon SQL and ownership-scoped queries
│  │  ├─ user.repository.js
│  │  ├─ project.repository.js
│  │  └─ folder.repository.js
│  ├─ validators/                      # request/workflow schemas and limits
│  └─ _db.js                           # existing pool, retained or moved compatibly
├─ frontend/
│  ├─ core/
│  │  ├─ auth/                         # auth client/session adapter
│  │  ├─ persistence/                  # local/API persistence abstraction
│  │  ├─ events/                        # fg-auth-ready and page-level events
│  │  └─ security/                     # safe DOM builders/allowlists
│  ├─ dashboard/
│  │  ├─ dashboard.controller.js       # current home.js orchestration
│  │  ├─ project.service.js
│  │  ├─ folder.service.js
│  │  ├─ settings.controller.js
│  │  └─ dashboard.view.js
│  ├─ builder/
│  │  ├─ builder.controller.js         # current main.js orchestration
│  │  ├─ builder.model.js              # nodes/connections/viewport state
│  │  ├─ canvas.view.js                # DOM/SVG rendering
│  │  ├─ interaction.controller.js     # pointer/touch/keyboard interactions
│  │  ├─ history.service.js
│  │  ├─ import-export.service.js
│  │  └─ builder.persistence.js
│  └─ onboarding/onboarding.controller.js
├─ views/
│  ├─ index.html
│  ├─ builder.html
│  ├─ onboarding.html
│  └─ auth/google-callback.html
├─ public/
│  ├─ css/                             # preserve current CSS filenames initially
│  └─ assets/
├─ vercel.json
├─ package.json
└─ README.md
````

If this exact tree is unsuitable for Vercel static routing, adapt it while keeping a clear equivalent separation. Do not invent unrelated domain modules. The builder's canvas rendering and interaction code may remain a frontend module rather than pretending it is a server-side View/Controller.

RESPONSIBILITY MAPPING

- Backend controllers: parse the Hono request, invoke services, and format the existing JSON responses/statuses.
- Backend services: own auth exchange policy, account deletion orchestration, project/folder business rules, and relationship validation when that is explicitly approved.
- Backend repositories: contain all Neon SQL, always parameterized, with ownership predicates at the repository boundary.
- Backend middleware: centralize Bearer extraction/JWT verification without allowing controllers to trust client user IDs.
- Backend models/validators: represent user, project metadata, folder, and workflow JSON; preserve snake_case API/database mapping and camelCase client mapping.
- Frontend core: preserve FGAuth, FG facade, localStorage keys, demo sentinel, API wrapper, legacy migration, and fg-auth-ready event semantics.
- Dashboard modules: split current home.js by orchestration, data adapter, settings, and safe DOM view construction; preserve filters, CRUD, folders, optimistic behavior unless a separately documented change is approved.
- Builder modules: split current main.js by state/model, rendering, interaction, history, import/export, context menus, mobile behavior, and autosave without changing node/connection/viewport behavior.
- Views/static assets: preserve HTML IDs/classes or update every reference atomically; preserve CSS paths and third-party loading requirements until an explicit asset migration is verified.

SECURITY PRESERVATION AND AUDIT FINDINGS

Preserve all existing controls:

1. Every authenticated API operation must derive identity from verified JWT payload.userId.
2. Every project/folder read/update/delete must remain ownership-scoped by user_id.
3. All SQL values must remain parameterized; no user input may enter SQL identifiers/clauses.
4. Do not trust client-supplied user IDs.
5. Preserve demo mode isolation from authenticated API mode.
6. Preserve workflow data format and import/export behavior unless a versioned migration is explicitly documented.

The security audit identified these items. Do not silently fix or silently regress them during restructuring:

- FG-001: js/home.js currently concatenates user-controlled folder/project/search values into innerHTML. During restructuring, do not reproduce this pattern in views. A separately justified security fix should replace dynamic HTML concatenation with DOM construction/textContent and must be regression-tested.
- FG-002: OAuth currently lacks state/nonce correlation. Do not make this weaker or hide it in a new auth service. Preserve the current contract temporarily only if required for incremental migration, document it, and create a separate explicit change to add state/PKCE with tests.
- FG-003: OAuth fallback currently places a bearer token in google_token query string. Do not introduce additional token URL propagation. A future fix must be explicit and verified.
- FG-004: project create/update currently accepts folderId without validating target folder ownership. Keep the current behavior only as a consciously documented compatibility decision, or implement the separately justified relationship validation and verify existing data handling; never remove project ownership checks.
- FG-005: JWT is stored in localStorage. Do not expose it through new logs, URLs, DOM, or error messages. A move to HttpOnly cookies is a separate session redesign requiring CSRF/CORS/logout testing.
- FG-006: workflow JSON has weak visible size/shape validation. Do not expand accepted payloads accidentally. A future validator may be introduced separately with compatibility limits and migration handling.
- FG-007: make no unverified claims about Google provider validation; preserve provider exchange semantics until a controlled verification policy is approved.
- FG-008/FG-009: preserve deployment compatibility while separately checking headers, CSP, CDN integrity, and CORS allowlists.

MIGRATION ORDER

1. Perform full reconnaissance: read every source file, HTML script/style reference, CSS selector used by JavaScript, package/lockfile, vercel rewrite, README/docs, and this audit report.
2. Record a dependency map of globals, IDs, CSS classes, localStorage keys, API paths, event names, script load order, and import/export data fields.
3. Add only non-mutating characterization checks or a written checklist first; do not change behavior yet.
4. Extract backend configuration, JWT/auth middleware, and database repositories while keeping api/index.js route URLs and response shapes unchanged.
5. Extract backend controllers/services incrementally, one route group at a time: auth, projects, folders. Verify ownership predicates after each move.
6. Extract shared frontend core (`FGAuth`, `FG`, local/API persistence) without changing storage keys, demo sentinel, event names, or migration behavior.
7. Extract dashboard modules from home.js while preserving DOM IDs/classes and script initialization timing. Replace unsafe dynamic HTML only as an explicitly tracked security improvement with focused regression tests.
8. Extract builder modules from main.js in low-risk slices: model/state, rendering, history, import/export, persistence, then pointer/touch/context-menu interactions. Keep builder canvas logic frontend-native.
9. Move HTML/CSS/assets only after all references are mapped; update static paths and Vercel behavior atomically.
10. Remove obsolete files only after all pages, routes, direct URLs, and deployment previews have been validated. Do not delete or rename user files without explicit scope.

DEPENDENCY CONSIDERATIONS

- Preserve package type/module behavior for api/\*.js and the current Hono, Neon, jsonwebtoken, and Vercel dependencies.
- Preserve browser IIFE compatibility or deliberately convert all pages to modules in one verified step; do not mix loading models accidentally.
- Preserve `shared.js` before `auth.js` before page controller ordering, or replace globals with an explicit bootstrap that is validated on every page.
- Track all DOM IDs used by home.js/main.js and all CSS selectors that style them.
- Keep `window.FG`, `window.FGAuth`, `window.__fgAuthCallback`, `window.__fgIsDemo`, and `fg-auth-ready` compatible until all consumers are migrated.
- Do not install dependencies or modify package-lock unless the restructuring task explicitly requires and verifies it.

REGRESSION CONTROLS AND VALIDATION CHECKLIST

After each migration slice, validate:

- JavaScript syntax for every moved file; imports/references resolve.
- Static pages load with correct CSS, image, favicon, CDN, and script paths.
- Vercel `/api/*` rewrite still reaches the Hono entrypoint.
- All auth routes retain status codes, response shapes, JWT expiry, and user identity semantics.
- Invalid/missing/expired/altered JWTs remain unauthorized.
- User A cannot read/update/delete User B's projects or folders by changing IDs.
- Project `folderId` relationship behavior is explicitly documented and tested.
- Demo mode uses only localStorage and never sends authenticated API calls.
- Login mode loads API data, onboarding updates the name, logout clears session state, and account deletion remains scoped.
- Legacy `wf_builder_state_v1` migration remains idempotent.
- Dashboard project/folder creation, rename, duplicate, archive, move, delete, filtering, search, settings, font/theme, and mobile sidebar behavior remain intact.
- Builder add/edit/delete/duplicate/select/copy/paste/undo/redo/connection drag/pan/zoom/reset/clear/shortcuts/mobile sheets remain intact.
- Import rejects malformed workflow data safely; export format remains compatible.
- Autosave remains debounced and writes the correct local/API persistence target.
- Dynamic user values render as text, not executable HTML; do not reintroduce FG-001.
- OAuth state/token handling remains no weaker than before, and no new token URL/log leakage is introduced.
- No secrets, JWTs, Google tokens, DATABASE_URL, or full workflow payloads appear in logs or errors.
- Deployed responses are inspected for actual CORS, CSP, referrer, framing, MIME, and HSTS behavior.

PROHIBITED BEHAVIOR

- Do not perform a large rewrite or change product behavior without documenting it.
- Do not alter API paths or JSON response shapes without explicit compatibility analysis.
- Do not remove user ownership predicates or move authorization exclusively to the frontend.
- Do not trust URL/project/folder IDs or client user IDs for authorization.
- Do not use `innerHTML`/HTML templates with user-controlled values; use safe DOM APIs.
- Do not move tokens into URLs, logs, DOM text, or error messages.
- Do not silently fix, hide, or downgrade audit findings; list any separately implemented security improvement and re-test it.
- Do not modify production data, create external test accounts, attack third-party services, perform load/DoS testing, or install unapproved dependencies.
- Do not delete original files until the replacement is verified and the migration report records the mapping.

FINAL DELIVERABLE

Produce a restructuring report describing:

1. Reconnaissance results and actual dependency map.
2. Final directory tree and responsibility mapping.
3. Every file moved/created/removed and why.
4. API/static path and script-loading changes.
5. Security controls preserved.
6. Audit findings preserved, explicitly fixed, or intentionally left for a separate task.
7. Tests/checks run and their results.
8. Known limitations and rollback/migration notes.

Finish only after the current FlowGram behavior, API contracts, authentication, authorization, persistence, import/export, deployment paths, and responsive frontend behavior have been revalidated. Do not claim the restructure is secure merely because files moved successfully.

```

```
