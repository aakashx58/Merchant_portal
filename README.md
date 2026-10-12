# TechKraft: Merchant Payments Portal

Angular 20 portal where sales staff submit merchant applications, reviewers decide on them, and admins
manage assignments and users. It runs against a built-in mock backend, so no server is needed.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [Roles and permissions](#roles-and-permissions)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Security](#security)
- [Testing](#testing)
- [Conventions](#conventions)
- [Status and roadmap](#status-and-roadmap)

## Features

- **Dashboard:** server-side paging, sorting, search and status filter; loading, error and retry states; status counts for admins.
- **New application wizard:** five steps (Business, Contacts, Financial, Documents, Review) with reactive forms, field validation, and a unique tax-ID check.
- **Draft auto-save:** debounced, versioned, keeps your form on failure, and saves when you leave the page.
- **Application detail and review:** sectioned view with a history timeline; approve/reject controls only for the assigned reviewer.
- **Sensitive data:** tax ID and account number are masked; reveal is permission-gated, logged, and auto-hides.
- **Review queue, assignments, users, audit log:** one table page each, sharing the same state and layout code.
- **Auth:** bearer token interceptor with a single token refresh for concurrent 401s.

## Tech stack

Angular 20 (standalone components, signals, `inject()`, `@if`/`@for`), Angular Material with SCSS,
RxJS, Reactive Forms, Vitest with Angular TestBed, ESLint, Prettier, Husky and lint-staged.

## Getting started

```bash
npm install
npm start                 # http://localhost:4200
```

| Command | What it does |
| --- | --- |
| `npm start` | Dev server with the mock backend |
| `npm run build` | Production build (`dist/techkraft`) |
| `npx ng build --configuration staging` | Staging build |
| `npm test` | Unit tests (Vitest) |
| `npm run lint:check` / `npm run lint:format` | Lint / lint and fix |
| `npm run prettier:check` / `npm run prettier:format` | Check / apply formatting |

## Demo accounts

Fake users from the mock backend (password for all: `password`). No real data is used anywhere.

| Username | Role |
| --- | --- |
| `sales`, `sales2` | SALES |
| `reviewer`, `reviewer2` | REVIEWER |
| `admin` | ADMIN |

## Roles and permissions

| Role | Can do |
| --- | --- |
| SALES | Create and edit their own applications, view their own applications |
| REVIEWER | View applications assigned to them, record an approve/reject decision with risk level and note, reveal sensitive fields |
| ADMIN | View all applications, assign reviewers, manage users, see status counts and the audit log, reveal sensitive fields |

The role to permission map is in `src/app/core/config/role-permissions.config.ts`.
Admins cannot record review decisions; that is reserved for the assigned reviewer.

## Project structure

```
src/
├── environments/            Per-environment config, typed by environment.model.ts
├── styles/                  Global SCSS: tokens, theme, _page.scss (page header, filter bar, .details, .status-badge, .stat-card)
└── app/
    ├── core/                App-wide singletons, no UI
    │   ├── api/             ApiService: base class for HTTP services (retry, timeout, params)
    │   ├── config/          ENVIRONMENT token, role to permission map
    │   ├── constants/       Role and permission enums
    │   ├── error-handling/  GlobalErrorHandler
    │   ├── guards/          auth, permission and route guards
    │   ├── interceptors/    auth (token and refresh), http-error (toast / redirect)
    │   ├── models/          Domain types
    │   ├── services/        Cross-feature services (applications, assignment, auth) plus toast, dialog, logger
    │   ├── state/           ListStore: shared state for every table page
    │   └── utils/
    ├── shared/              Reusable presentational pieces: data-table, dialog, masked-field, layout, confirm-dialog, appCell directive
    ├── features/<name>/     One lazy-loaded folder per page
    │   ├── components/      UI only: templates, inputs and outputs
    │   ├── services/        API services used by this feature only
    │   ├── stores/          Signal-based state and orchestration, one store per page
    │   └── <name>.routes.ts
    ├── mock-backend/        Dev-only fake API (interceptor, in-memory data). Delete it to go live
    └── testing/             Test helpers (basic accessibility checks)
```

Features: `auth`, `dashboard`, `wizard`, `review`, `admin`, `audit-log`, `error-pages`.

**Rule of thumb:** components render, stores decide, services talk HTTP. A component injects its store;
a store injects services; a service extends `ApiService`.

## How it works

### State management

Plain signals, no library. Every table page (dashboard, review queue, assignments, users, audit log)
extends `ListStore<TItem, TQuery>` (`core/state/list-store.ts`), which provides the `query` signal,
debounced `search`, `data` / `loading` / `error`, `onSort`, `onPage` and `patch()` (a filter change goes
back to page 1 and reloads). A newer request cancels a stale one. A page store only supplies `fetch()`,
its columns and its page-specific actions. The wizard store is separate: a form with debounced
auto-save and version checks.

### API layer

```
component -> store -> XxxService (extends ApiService) -> HttpClient -> interceptors -> server
```

- `ApiService` builds URLs from the injected environment, handles params, retry on retryable statuses and timeout. `get`/`post`/`put`/`patch`/`delete` are protected, so only typed services can call them.
- One service per resource with named methods (`list`, `getById`, `updateRole`).
- Paged endpoints take `page, pageSize, sort, dir, q` plus filters and return `{ items, total, page, pageSize }`.

### Error handling

| Layer | Behaviour |
| --- | --- |
| `http-error.interceptor` | Maps the status to a message and toasts it, unless the request is marked `handledInline()` |
| `ListStore` | Load errors go to `error()`; the table shows an error state with Retry |
| Store mutations | Success and failure are toasted (assign reviewer, change role, submit application) |
| `GlobalErrorHandler` | Last resort for uncaught exceptions: logs and toasts |
| Routes | `/unauthorized` (403), `/error` (500), `**` (404) |

### Environments

`environment.ts` (dev), `environment.staging.ts` and `environment.prod.ts`, swapped by `fileReplacements`
in `angular.json`. Code never imports an environment file directly: `app.config.ts` provides it once and
consumers `inject(ENVIRONMENT)`. `mockBackend: true` turns on the mock backend.

## Security

- **Auth:** a bearer token is attached by an interceptor. Concurrent 401s trigger exactly one `POST /auth/refresh`; the waiting requests retry once with the new token. A failed refresh signs the user out.
- **Permissions:** every protected route has `authGuard` and `permissionGuard`, and navigation links are hidden without the permission. The UI is never the only check: the mock API enforces the same permissions on every request.
- **Sensitive fields:** tax ID and account number arrive masked. A reviewer or admin reveals one through a separate logged call; the value auto-hides after 15 seconds and is held only in that component.
- **Data:** the mock users and passwords are fake demo data. No real customer or card data and no secrets are committed.
- **Rendering:** no `innerHTML` and no `bypassSecurity*` calls, so Angular's sanitising always applies.

### Content Security Policy

A CSP tells the browser which origins may run scripts, load styles, fonts and images, and receive
requests. Even if an attacker injects markup (XSS), an inline `<script>` or a call to an attacker's
server is blocked, so injected code cannot read the token or a revealed value.

Recommended production policy, sent as a response header by the host (`frame-ancestors` is ignored in a
`<meta>` tag):

```
default-src 'self';
script-src 'self';
style-src 'self' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self';
object-src 'none';
base-uri 'self';
frame-ancestors 'none'
```

Angular's production build can run without `'unsafe-inline'` if `ngCspNonce` is set on the root element
and the server returns a fresh nonce per response. The policy is not applied in the dev server because
the dev build injects inline scripts.

## Testing

`npm test` runs Vitest through the Angular builder (255 tests, 35 files):

- Stores: list state, wizard form, auto-save debounce, submit
- Validators and the `ApiService` retry and timeout behaviour
- Guards and the auth interceptor, including concurrent-401 refresh
- Mock handlers: auth, applications, users, audit log
- Components: dashboard, review queue, assignments, users, audit log, layout, wizard, application detail (role-based controls), masked field, error pages
- A basic accessibility check (`src/app/testing/a11y.ts`) on every page: labelled controls, named buttons and links

## Conventions

- Files are `kebab-case.<kind>.ts` (`user-management.store.ts`, `api.service.ts`); classes are `PascalCase` with a kind suffix.
- Feature and component folders share the page name.
- Templates call `store.method()` directly; components have no pass-through methods.
- Required form labels use `class="required"` (adds the asterisk).
- Pages share `.page`, `.page-header`, `.filter-bar`, `.details`, `.status-badge` and `.stat-card` from `src/styles/_page.scss`.

### Adding a list page

1. Add `XxxService extends ApiService` with `list(query)`.
2. Add `XxxStore extends ListStore<Item, Query>`: pass the initial query, default sort and error text, implement `fetch`, call `this.load()`.
3. Add the component with `<app-data-table>`, `appCell` templates for formatted cells, and the shared page header and filter bar.
4. Add a lazy route with `permissionGuard(...)` and a sidebar link guarded by the same permission.

## Status and roadmap

Done: all required features above, dashboard counts, auth refresh interceptor, lint clean, 255 passing tests.

Still open:

- Real-time status updates with Socket.IO and a polling fallback (on hold)
- Apply the CSP in a production build (documented, not set)
- Move tokens out of `sessionStorage` into an httpOnly cookie (needs a real backend)
- `AuthService` uses a hard-coded `/api` prefix instead of the environment `apiBaseUrl`
- Mock role changes live in memory and reset on reload
- Manual click-through of every role in a browser before submitting
