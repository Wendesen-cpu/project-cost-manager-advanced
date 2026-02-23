# Project Cost Management — Development Tasks

## Step 1: Backend Foundation & App Router Setup ✅

> **Goal:** Initialize the database schema, authentication structure, API layer, and Next.js App Router scaffold — ready for Figma design injection.

### 1.1 Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Docker)
- **ORM:** Prisma 7 with `@prisma/adapter-pg`
- **Language:** TypeScript

### 1.2 Database Schema (`prisma/schema.prisma`)

Defined and migrated the following models:

| Model | Key Fields |
|---|---|
| `User` | id, name, lastName, email, password, role (ADMIN/EMPLOYEE), monthlyCost, remainingVacationDays |
| `Project` | id, name, description, startDate, endDate, paymentType (FIXED/HOURLY), totalProjectPrice, fixedCostType (TOTAL/MONTHLY), totalFixedCost, status (ACTIVE/ARCHIVED/PLANNED), ownerId |
| `ProjectAssignment` | id, userId, projectId *(unique pair — enforces access control)* |
| `TimeLog` | id, userId, projectId, date, hours, type (WORK/VACATION) |

### 1.3 Local Database (Docker)

- `docker-compose.yml` spins up `postgres:15-alpine` as `project_cost_manager_db` on port `5433`
- `DATABASE_URL` configured in `.env`
- Initial migration applied: `20260223120747_init`

```bash
docker compose up -d      # start DB
npx prisma migrate dev    # run migrations
npx prisma generate       # regenerate client
```

### 1.4 Prisma Client (`lib/prisma.ts`)

- Uses Prisma 7's adapter-based pattern via `@prisma/adapter-pg`
- Singleton pattern safe for Next.js hot-reload

### 1.5 Route Protection (`middleware.ts`)

| Route | Required Role | Redirect |
|---|---|---|
| `/admin/*` | `ADMIN` | `/login` |
| `/portal/*` | `EMPLOYEE` | `/login` |

> ⚠️ Auth is currently **mocked via a `mock-role` cookie**. Replace with NextAuth / JWT before production.

### 1.6 API Route Handlers (`app/api/`)

All endpoints return standard JSON and are designed to be called by the future AI chatbot agent.

| Endpoint | Methods | Description |
|---|---|---|
| `/api/admin/employees` | GET, POST | List / create employees |
| `/api/admin/employees/[id]` | GET, PUT, DELETE | Read / update / delete employee |
| `/api/admin/projects` | GET, POST | List / create projects |
| `/api/admin/projects/[id]` | GET, PUT, DELETE | Read / update / delete project |
| `/api/admin/assignments` | POST, DELETE | Assign / remove employee from project |
| `/api/employee/time-logs` | GET, POST | Log time — supports **bulk array** input |

### 1.7 Frontend Wireframes

Basic Tailwind wireframes created — **intentionally minimal**, ready for Figma-MCP design injection:

- `app/login/page.tsx` — login form
- `app/admin/page.tsx` — admin dashboard card grid
- `app/portal/page.tsx` — employee time logging form

---

## Step 2: UI Design (Figma MCP injection)

### 2.1 Committed: `feat(ui): add EmployeeHeader and TopNav components to portal page`

#### `app/components/EmployeeHeader.tsx` *(new)*
- Glassmorphism badge with frosted background
- Gradient text for employee name
- Built from Figma design specs

#### `app/components/TopNav.tsx` *(new)*
- Brand logo on the left
- Language switcher (flag + label) on the right
- Logout button
- Aligned `max-w-screen-xl mx-auto` container to match main content padding

#### `app/portal/page.tsx` *(modified)*
- Replaced minimal wireframe with `<TopNav />` + `<EmployeeHeader />` layout
- Aligned padding and container classes between TopNav and content area

#### `app/components/LogWorkForm.tsx` *(new)*
- Client component (`'use client'`)
- Date input, Project select (with inline SVG chevron), Hours numeric input
- "Log Hours" submit button styled with `#155DFC` brand blue
- Max-width constrained to `302px` per Figma spec

---

### 2.2 Remaining UI — 🔜 In Progress

- [ ] Build `StatCard.tsx`
- [ ] Build `SectionHeader.tsx`
- [ ] Build `ActivityAccordion.tsx`
- [ ] Compose `EmployeeSidebar.tsx` and integrate into `app/portal/page.tsx`

---

## Step 3: Authentication (NextAuth / JWT) — 🔜 Pending

## Step 4: AI Chat Integration — 🔜 Pending
