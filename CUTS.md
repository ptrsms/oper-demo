# Cuts and trade-offs

Scope decisions made up-front to fit the 2h cap. Each cut is something we'd add with more time; none are accidental omissions.

## Simulation flow

| Cut | Why |
|---|---|
| Project-purpose-driven branching after the cards | All five purpose cards lead into the same details form. We capture the value on the simulation row but don't fork the flow (e.g. no "Refinance" sub-form with existing-loan tranches). |
| Renovation budget section ("I want to renovate") | Adds a nested cost structure to the loan calc. Not core to the demo. |
| Refinance loans (mortgage + non-mortgage) | Each adds a sub-form with its own validation. Out of the happy path. |
| Collateral and bridge loans (Your contribution step) | Same reason — sub-forms, off the happy path. |
| Rental-income per-property address fields | `RENTAL` stays in the `IncomeType` enum; we don't capture the property-scoped fields the reference UI shows. |
| Mortgage-overview sliders (adjust loan amount / own funds / duration post-simulation) | The simulation is recomputed on submit only. Live re-tuning is a polish feature. |
| "Save and log-in for 14 days" CTA + apply-until countdown | `apply_until` is stored on the row, but we don't enforce expiry or surface the countdown. |
| Rate-adjustment / discount activations | Pricing engine territory — way out of scope. |
| Product recommendation panel beyond Fixed | `ProductType` enum stays general; the recommender always returns FIXED. |

## Auth

| Cut | Why |
|---|---|
| Phone verification (SMS code) | `phone` column on User stays optional; the verify-code screen is stubbed out of the flow. |
| Email confirmation, password reset, "Forgot password?" | Requires an SMTP integration and a reset-token flow. The PDF explicitly allows stubbed email. |
| Cookie-based auth with HTTPS-only / SameSite config | Bearer token + localStorage is simpler on Vercel's serverless setup. Trade-off (XSS exposure) called out in README. |
| Refresh tokens | Single short-lived access token. Re-login on expiry. |
| i18n / language switcher | English only. |

## Application wizard

| Cut | Why |
|---|---|
| ~5+ step wizard reduced to 3 (Property → Financials → Personal) | Matches the brief's "single multi-step form is fine". |
| Multi-borrower data capture | The simulator offers "Applying with someone" and persists `number_of_borrowers=2`, but the application wizard only renders Borrower 1's form. The second borrower row is created but stays empty until we add the UI. |
| Multi-income per borrower UI ("+ More incomes") | Model supports 1..n `Income` rows; the wizard captures one income line. |
| Itemised expenses with type picker | Model has `Expense` with type; UI captures a single monthly-expenses figure as one `OTHER` row. |
| Collateral / bridge loan sections | See simulation cuts. |

## Dashboard

| Cut | Why |
|---|---|
| Notifications panel ("Please upload your documents") | Pure UI surface; the underlying state (uploaded vs requested) is queryable. |
| Property photo on the application card | Placeholder image only. |
| Contact request / callback flow | Out of scope. |
| Apply-until expiry badge with countdown | See simulation cuts. |

## Documents

| Cut | Why |
|---|---|
| `DocumentRequirement` table | Required-docs list is derived server-side from the `DocType` enum × borrower count, joined with what's uploaded. Avoids a seed/sync table for no functional gain. |
| Multiple Payslip slots per borrower | One Payslip per borrower in the requirements list. |
| Per-document contextual labels (EPC at "Ankerrui 1, 2000 Antwerpen", Payslip for "John Doe") | Implemented for borrower-scoped docs; EPC shows the application's property address but no map / verify step. |
| File preview, re-upload UX, drag-and-drop | Plain file input + upload button. |
| GDPR copy ("Learn more about how we treat your data") | Static link omitted. |

## Engineering / infrastructure

| Cut | Why |
|---|---|
| Alembic migrations | `Base.metadata.create_all` on app boot. Single-developer demo, no migration history to preserve. |
| Real email / SMS providers | Stubbed; PDF explicitly allows this. |
| Object storage for documents (Vercel Blob, S3) | Bytes in Postgres `BYTEA`. Acceptable for small demo PDFs; would not ship to prod. |
| Comprehensive test suite | 2–3 meaningful FastAPI tests only (simulation calc, application state transition, document-list derivation). PDF says "few meaningful tests beat a sea of generated ones". |
| Observability stack (Sentry, OTel, structured log forwarding) | `structlog`-style logging only; no external sink. |
| Rate limiting, CSRF, audit log, soft delete | Out of scope for a 2h demo. |
| Production CI | Vercel's default preview/prod deploys only. No GitHub Actions matrix. |

## Visual polish

| Cut | Why |
|---|---|
| Pixel-matching the Demo Bank brand | Tailwind defaults + a clean neutral palette. |
| Animations, transitions, micro-interactions | None. |
| Mobile-responsive layouts | Designed for desktop widths; degrades but isn't optimised. |

## If we had another 2 hours

In rough priority order:
1. Multi-borrower + multi-income UI (model already supports it).
2. Required-document slots per borrower (DocumentRequirement table) so payslip counts can vary.
3. Vercel Blob for document storage + signed download URLs.
4. Alembic + a tiny integration test suite hitting a real Postgres in CI.
5. Cookie-based auth via Vercel same-origin rewrites.