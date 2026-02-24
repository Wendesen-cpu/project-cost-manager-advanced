# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Build & Run Commands

```bash
# Start PostgreSQL (required before running the app)
docker compose up -d

# Run Prisma migrations and regenerate client
npx prisma migrate dev
npx prisma generate

# Development server
npm run dev          # starts on http://localhost:3000

# Build & production
npm run build
npm run start

# Lint
npm run lint         # runs eslint
```

## Architecture Overview

This is a **Next.js 16 App Router** project for internal project cost management — tracking employees, projects, assignments, and time logs. It uses **Prisma 7** with the `@prisma/adapter-pg` driver adapter over a **Dockerized PostgreSQL** (port 5433).

### Key Layers

- **Database**: PostgreSQL via Docker (`docker-compose.yml`, port 5433). Schema lives in `prisma/schema.prisma`.
- **ORM**: Prisma 7 with a pg adapter-based client singleton in `lib/prisma.ts`. Generated client output goes to `lib/generated/prisma/` (gitignored — must run `npx prisma generate` after cloning).
- **API Routes** (`app/api/`): REST endpoints returning JSON. All use `import prisma from '@lib/prisma'` and enums from `@lib/generated/prisma/enums`. Designed to be consumed by a future AI chatbot agent.
  - `/api/admin/employees` — CRUD for employees (GET list, POST create; `[id]` sub-route for GET/PUT/DELETE)
  - `/api/admin/projects` — CRUD for projects (includes assignments in GET responses)
  - `/api/admin/assignments` — POST/DELETE to manage employee↔project assignments (unique constraint on `[userId, projectId]`)
  - `/api/employee/time-logs` — GET (requires `?userId=`), POST (accepts single object or bulk array; validates project assignment for WORK logs)
- **Middleware** (`middleware.ts`): Route protection using a `mock-role` cookie. `/admin/*` requires `ADMIN`, `/portal/*` requires `EMPLOYEE` or `ADMIN`. Auth is **mocked** — not production-ready.
- **Pages**: `app/page.tsx` redirects to `/login`. `app/login/page.tsx` sets mock-role cookie based on email. `app/admin/page.tsx` is a wireframe dashboard. `app/portal/page.tsx` is the styled employee portal.
- **UI Components** (`app/components/`): Figma-derived components for the employee portal (TopNav, EmployeeHeader, EmployeeSidebar, MonthlyCalendar, RecentActivity, etc.). Styled with Tailwind CSS v4 using brand blue `#155DFC` and specific design tokens from Figma specs.

### Data Model (Prisma enums)

- `Role`: ADMIN, EMPLOYEE
- `PaymentType`: FIXED, HOURLY
- `FixedCostType`: TOTAL, MONTHLY
- `ProjectStatus`: ACTIVE, ARCHIVED, PLANNED
- `TimeLogType`: WORK, VACATION

### Path Aliases (tsconfig)

- `@/*` → `./*`
- `@lib/*` → `./lib/*`
- `@prisma/client` → `./lib/generated/prisma`

## Conventions

- API route handlers use Next.js 16 async `params` pattern: `{ params }: { params: Promise<{ id: string }> }` with `const { id } = await params`.
- Prisma enums are imported from `@lib/generated/prisma/enums`, not from `@prisma/client`.
- UI components reference Figma asset URLs from a local design server (`localhost:3845`). These are placeholders and should be replaced with local SVGs or a proper asset pipeline for production.
- Client components are marked with `'use client'` directive. Server components are the default.
- Tailwind classes use the Figma design system colors directly (e.g., `#0F172B`, `#62748E`, `#314158`, `#E2E8F0`).
- `clsx` is used for conditional class merging in components.

## Project Status

Authentication (Step 3) and AI chat integration (Step 4) are pending. See `task.md` for the full roadmap.
