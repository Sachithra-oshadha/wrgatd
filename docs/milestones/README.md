# Milestone Guides

Executable build guides for the Weekly Report Management System, derived from
`Full_Development_Plan.md`. The plan document describes *what* to build in 40
phases; these documents describe *how*, in the order you should actually do it.

Each guide contains complete, copy-paste-ready code in this repository's existing
style, the exact PowerShell commands to run, the resulting file tree, and a
verification checklist.

---

## Milestones

| # | Guide | Deliverable | Plan phases | Status |
|---|-------|-------------|-------------|--------|
| M1 | [M1-setup-database.md](./M1-setup-database.md) | Project setup + PostgreSQL + ERD + migrations | 1–4 | Done |
| M2 | [M2-auth-rbac-users.md](./M2-auth-rbac-users.md) | Authentication + RBAC + user management | 5–7, 18 | Partly done |
| M3 | [M3-frontend-foundation-projects.md](./M3-frontend-foundation-projects.md) | Frontend foundation + projects + members | 8, 16, 17, 29 | Not started |
| M4 | [M4-weekly-reports-drafts.md](./M4-weekly-reports-drafts.md) | Weekly report creation/editing + drafts | 9, 10, 11, 20, 22 | Not started |
| M5 | [M5-submission-workflow.md](./M5-submission-workflow.md) | Submission + correction + approval workflow | 12, 13, 21 | Not started |
| M6 | [M6-versioning-reviews.md](./M6-versioning-reviews.md) | Version history + review system | 14, 15, 23, 24, 31 | Not started |
| M7 | [M7-dashboard-analytics.md](./M7-dashboard-analytics.md) | Manager dashboard + charts + filters | 19, 25, 26, 27, 28 | Not started |
| M8 | [M8-testing-docker-ai-polish.md](./M8-testing-docker-ai-polish.md) | Testing + Docker + AI + UI polish | 32–39 | Not started |

---

## Dependency chain

```
M1  Database schema
     |
M2  Auth + RBAC + users          <-- also closes M1 constraint gaps
     |
M3  App shell + design system + projects
     |
M4  Reports (create / edit / draft)
     |
M5  Status workflow (submit / approve / request changes)
     |
M6  Versioning + review audit trail
     |
M7  Dashboard + analytics        <-- needs real data from M4-M6
     |
M8  Tests, Docker, seed, AI, polish
```

Do not jump ahead to M7. The dashboard aggregates over reports, statuses,
versions and reviews; without M4–M6 there is nothing to aggregate.

---

## Repository conventions

These are extracted from the code already written in M1/M2. Every guide follows
them so new code is indistinguishable from existing code.

### Backend

- **SQLAlchemy 2.0 style.** `Mapped[T]` annotations with `mapped_column(...)`.
  Never the legacy `Column(...)` form.
- **Primary keys** are `<entity>_id` integers, not `id`. `user.user_id`,
  `report.report_id`, `version.version_id`.
- **Queries** use `db.scalar(select(Model).where(...))` and
  `db.scalars(select(...)).all()`. Never `db.query(Model)`.
- **Timestamps** are timezone-aware, set with a lambda default:
  `default=lambda: datetime.now(timezone.utc)`.
- **Formatting** — each `mapped_column` block is separated by a blank line, and
  multi-argument calls are broken one-argument-per-line.
- **Layering** (introduced in M3):
  - `app/api/*` — thin routers: parse, authorize, delegate, serialize.
  - `app/services/*` — business rules, transactions, multi-table writes.
  - `app/schemas/*` — Pydantic request/response models.
  - `app/models/*` — SQLAlchemy tables only.
- **Auth** is an HTTP-only cookie named `access_token`, read via FastAPI's
  `Cookie(...)`. There is no `Authorization: Bearer` header path and no token in
  `localStorage`.
- **API version prefix** is `/api/v1` (added in M2 Part B).

### Frontend

- Next.js App Router, all pages under `frontend/src/app/`.
- Every backend call goes through `apiFetch` in `src/lib/api.tsx`, which sets
  `credentials: "include"` so the auth cookie is sent.
- Forms use React Hook Form + Zod via `@hookform/resolvers/zod`.
- Server state uses TanStack Query (added in M3). Do not `useEffect` + `fetch`.
- Colours come from the CSS variables defined in `globals.css` (M3 Part A), which
  encode the Phase 39 palette.

### Security rule

The frontend hides unauthorized UI. **The backend must independently enforce
every authorization rule.** A hidden button is not a permission check. Every
guide from M3 onward restates the specific rules it must enforce.

---

## Running the project

### Backend

```powershell
cd "F:\Personal Projects\wrgatd\backend"
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

API docs: <http://localhost:8000/docs>

### Frontend

```powershell
cd "F:\Personal Projects\wrgatd\frontend"
npm run dev
```

App: <http://localhost:3000>

### Migrations

```powershell
cd "F:\Personal Projects\wrgatd\backend"
.\.venv\Scripts\Activate.ps1

alembic current                                  # which revision is applied
alembic history                                  # full revision chain
alembic revision --autogenerate -m "message"     # create a revision
alembic upgrade head                             # apply everything
alembic downgrade -1                             # roll back one revision
```

Always read an autogenerated migration before running it. Alembic does not
detect enum type changes, `server_default` values, or constraint renames
reliably; several guides show the hand-corrected version alongside the generated
one.

---

## Git branches

Phase 1 of the plan asks for feature branches. Suggested mapping:

| Milestone | Branch |
|---|---|
| M2 gap closure | `feature/auth` |
| M3 | `feature/projects` |
| M4 | `feature/reports` |
| M5 | `feature/reports` |
| M6 | `feature/reviews` |
| M7 | `feature/dashboard` |
| M8 | `feature/testing`, `feature/docker`, `feature/ai-assistant` |

Merge into `develop`, then `develop` into `main` at each milestone boundary.
