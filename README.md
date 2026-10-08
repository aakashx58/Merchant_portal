# TechKraft — Merchant Payments Portal

A senior-level Angular 20 take-home assignment implementing a production-oriented merchant payments portal with role-based access control, reactive state management, and a mock backend interceptor.

## Tech Stack

- **Angular 20** — Standalone components, Signals, `inject()`, built-in control flow (`@if`/`@for`)
- **Angular Material** — UI components and responsive layouts (SCSS)
- **RxJS** — Reactive async flows, auto-save debouncing, HTTP retry logic
- **Reactive Forms** — Multi-step wizard with custom validators and draft saving
- **Vitest** — Unit testing with Angular TestBed
- **ESLint + Prettier** — Code quality and formatting
- **Husky + lint-staged** — Pre-commit hooks

## User Roles

| Role | Permissions |
|---|---|
| `SALES` | Creates/edits merchant applications, views own applications |
| `REVIEWER` | Reviews assigned applications, records risk decisions |
| `ADMIN` | Views all applications, manages assignments |

## Getting Started

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm start
```

Navigate to `http://localhost:4200/`.

### Build

```bash
npm run build
```

### Run unit tests

```bash
npm test
```

### Lint & Format

```bash
# Check for lint errors
npm run lint:check

# Auto-fix lint errors
npm run lint:format

# Check formatting
npm run prettier:check

# Auto-format files
npm run prettier:format
```

## Project Structure

```
src/
├── app/
│   ├── core/            # Singletons: services, interceptors, guards, models
│   ├── shared/          # Reusable components, directives, pipes
│   └── features/        # Lazy-loaded feature modules (dashboard, wizard, review)
├── styles.scss          # Global styles
└── main.ts
```

## Security

- Bearer token attached via HTTP interceptor
- Automatic token refresh on concurrent 401 responses
- Role-based UI rendering (no client-side permission bypass)
- Sensitive fields masked by default with controlled reveal
