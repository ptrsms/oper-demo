# CLAUDE.md — web/

Angular 18 SPA. Standalone components, lazy-loaded routes, Tailwind for styling. No NgModules.

## Layout

```
src/app/
├── app.component.ts        # root
├── app.config.ts           # providers: router (with component-input-binding), HttpClient + authInterceptor
├── app.routes.ts           # all routes, lazy via loadComponent
├── api/
│   └── schema.d.ts         # GENERATED from FastAPI OpenAPI — do not hand-edit
├── core/
│   ├── auth.service.ts     # signals-based, token in localStorage
│   ├── auth.guard.ts       # functional CanActivateFn
│   ├── auth.interceptor.ts # attaches Bearer token to API calls
│   └── simulation.service.ts
├── features/               # route-targeted screens
│   ├── simulator/
│   ├── auth/               # signup / login
│   ├── dashboard/
│   └── application/        # wizard shell + steps/* (property, financials, personal, documents, submitted)
└── shared/                 # cross-feature layout shells (anon vs authed)
```

## Conventions

- **Standalone components only.** Every component declares its own `imports: [...]`. No `NgModule`. New routes use `loadComponent: () => import(...)`.
- **Signals over RxJS for component state.** Use `signal()`, `computed()`, `effect()`. RxJS stays at the HTTP boundary (`HttpClient` returns Observables — `.subscribe()` or `toSignal` from them).
- **DI via `inject()`.** Use `inject(HttpClient)`, `inject(Router)`, etc., in field initialisers rather than constructor params.
- **Forms:** reactive forms (`FormBuilder`, `FormGroup`). Don't mix template-driven forms in.
- **Router:** all paths declared in `app.routes.ts`. Two layout shells — `AnonLayoutComponent` for the marketing/auth screens, `AppShellComponent` (with `authGuard`) for the authed app. Add new authed screens under the second block.
- **`withComponentInputBinding()` is on.** Route params bind directly to `@Input()` fields on the routed component — no need to inject `ActivatedRoute` for simple param reads.
- **Auth state:** read via `AuthService` signals (`isAuthenticated`, `currentUser`). Token lives in `localStorage` under `oper.access_token`; the interceptor attaches it. Don't read the token directly from `localStorage` outside `AuthService`.

## API types

`src/app/api/schema.d.ts` is generated from the live FastAPI OpenAPI:

```bash
# requires the API running on :8000
npm run gen:api
```

Regenerate after any backend schema/route change. Import types from `./api/schema` rather than hand-declaring request/response interfaces — except for small UI-only shapes that don't cross the wire (like `LoginPayload` in `auth.service.ts`).

## Styling

- Tailwind 3, config in `tailwind.config.js`. Use utility classes inline; don't add a parallel CSS module.
- Global styles in `src/styles.css` only for Tailwind directives + a handful of resets. Avoid adding component-scoped CSS files unless a utility-only solution is genuinely awkward.
- Designed for desktop widths. Mobile responsiveness is explicitly cut (see `CUTS.md`); don't spend tokens on `sm:`/`md:` polishing.

## Dev commands

```bash
npm start            # ng serve on :4200, proxies nothing — talks to :8000 directly via environment.apiBase
npm run build        # prod build → dist/web/browser (consumed by vercel.json)
npm test             # Karma + Jasmine (rarely used; see CUTS.md on test coverage)
npm run gen:api      # regenerate api/schema.d.ts from running backend
```

## Environments

`src/environments/environment.ts` sets `apiBase` — empty string in prod (same-origin via Vercel rewrite), `http://localhost:8000` in dev. Don't hardcode hostnames in components or services.

## When working here

- Adding a new screen? Add a `loadComponent` entry in `app.routes.ts`, drop the component under the relevant `features/<area>/`, and pick the right layout block (anon vs authed).
- Adding a new API call? Add a method on the matching service in `core/` (or a new feature-scoped service); types come from `api/schema.d.ts`.
- Don't pull in state-management libraries (NgRx, Akita, etc.) — signals + services are enough for this scope.
- Don't introduce a UI component library — the brief asks for clean Tailwind defaults, see `CUTS.md`.
