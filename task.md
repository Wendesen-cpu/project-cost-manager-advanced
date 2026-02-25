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

### 2.2 Committed: `feat(ui): compose EmployeeSidebar with StatCard, SectionHeader, ActivityAccordion, and LogWorkForm`

#### `app/components/StatCard.tsx` *(new)*
- Displays a single stat (title, large value, optional unit, icon)
- Rounded card with subtle shadow, configurable icon background color (`iconBgColor`)
- Styled per Figma: `#0F172B` value, `#62748E` label, uppercase tracking

#### `app/components/SectionHeader.tsx` *(new)*
- Small icon + uppercase bold label (`#62748E`, `tracking-[1.4px]`)
- Used as a section divider above `StatCard` groups and `ActivityAccordion`

#### `app/components/ActivityAccordion.tsx` *(new)*
- Client component with `useState` collapse/expand toggle
- Chevron rotates 180° on expand with `transition-transform`
- `isLast` prop controls the bottom border separator
- Uses `clsx` for conditional class merging

#### `app/components/EmployeeSidebar.tsx` *(new)*
- Composes the full left sidebar: `SectionHeader` → `StatCard` (×2) → `ActivityAccordion` × 2
- "Log Work Hours" accordion expanded by default, wraps `<LogWorkForm />`
- "Log Vacation" accordion placeholder (form coming soon)

#### `app/portal/page.tsx` *(modified)*
- Replaced the old generic time-log form with `<EmployeeSidebar />`
- Wrapped in a responsive `grid grid-cols-1 md:grid-cols-3` layout
- Right-hand 2-col area left as placeholder for future content

#### `package.json` + `package-lock.json` *(modified)*
- Added `clsx@^2.1.1` dependency (used by `ActivityAccordion`)

---

### 2.3 Committed: `feat(ui): implement right-side portal content — MonthlyCalendar and RecentActivity`

#### `app/components/CalendarHeader.tsx` *(new)*
- Month/year title (uppercase bold) + prev/today/next navigation buttons
- Chevron SVGs from Figma asset server; "Today" button in `#155DFC`

#### `app/components/CalendarDayCell.tsx` *(new)*
- Props: `day`, `isToday`, `isOtherMonth`, `logs[]`
- Renders day number in a filled blue circle for today; greyed for other-month days
- Stacks blue event chips (project name truncated + hours) per time log

#### `app/components/CalendarGrid.tsx` *(new)*
- Builds the calendar matrix from JS `Date` (no external library)
- Mon-based weekday offset, leading/trailing padding cells from adjacent months
- Renders 7-col day-of-week header row + grid of `CalendarDayCell`

#### `app/components/MonthlyCalendar.tsx` *(new)*
- Client component with `useState` for current month/year
- Handles prev/today/next navigation logic
- Composes `SectionHeader` + card shell + `CalendarHeader` + `CalendarGrid`
- Pre-seeded with sample logs matching Figma (weekdays Feb 2–13, 8h each)

#### `app/components/ActivityMonthRow.tsx` *(new)*
- Client component: collapsible row with calendar icon, month label, total hours
- Work hours (`#62748E`) and vacation hours (`#F97316`) shown as small labels
- Chevron toggles `expanded` state with rotate animation

#### `app/components/RecentActivity.tsx` *(new)*
- Composes `SectionHeader` + card shell + three `ActivityMonthRow` items
- Matches Figma data: April 2026 (92h), March 2026 (184h), February 2026 (112h)

#### `app/components/PortalMainContent.tsx` *(new)*
- Thin compositor: stacks `MonthlyCalendar` and `RecentActivity` with `gap-8`

#### `app/portal/page.tsx` *(modified)*
- Replaced `<div className="md:col-span-2" />` placeholder with `<PortalMainContent />`

---

---

### 2.4 Committed: `feat: refine project modal and implement new employee modal with lucide icons`

#### `app/components/admin/NewProjectModal.tsx` *(modified)*
- Separated Payment Type and Fixed Cost Structure so they can be selected independently.
- Dynamic placeholders and labels based on selection ("Hourly Rate" vs "Fixed Project Price").
- Constrained project modal UI per Figma specs.

#### `app/components/admin/NewEmployeeModal.tsx` *(new)*
- Created form with fields: First/Last Name, Email, Password, Role (ADMIN/EMPLOYEE), Monthly Cost, Vacation Days.
- Connected to the `POST /api/admin/employees` route to persist new employees.

#### `app/admin/page.tsx` *(modified)*
- Implemented horizontal constraints (`max-w-7xl mx-auto px-4 md:px-8`) for the main admin dashboard content.
- Passed `lucide-react` icons to the `DashboardStatCard` components instead of using image URLs.
- Rendered `NewEmployeeModal` and connected it to the Dashboard quick action button.

#### `app/components/admin/Sidebar*.tsx` *(modified)*
- Replaced all `localhost:3845` SVG assets across the Admin Sidebar (Logo, NavLinks, Footer) with equivalent vector icons from `lucide-react`.
- `lucide-react` icons dynamically inherit active (`#155DFC` / white) and inactive (`#90A1B9`) color states.

---

### 2.5 Committed: `feat(ui): implement admin employees page table and user fetching`

#### `app/api/admin/employees/route.ts` *(modified)*
- Removed the strictly `Role.EMPLOYEE` query filter from the `GET` method.
- The endpoint now returns all users (including admins) to populate the admin management table.

#### `app/admin/employees/page.tsx` *(new)*
- Created the main Admin Employees view using the same responsive container constraint (`max-w-7xl mx-auto px-4 md:px-8 lg:px-16`) as the Dashboard.
- Added a full-width data table styled exactly to Figma specs (border `#e2e8f0`, shadow, text `#6a7282`).
- Dynamically rendered Role and Email properties inside styled green badges (`bg-[#dcfce7] text-[#016630]`).
- Hooked up an "Add Employee" button in the header directly to our `NewEmployeeModal`.
- Added dynamic table refresh logic inside `useEffect` upon creation of a new employee via the modal.

---

### 2.6 Committed: `feat(ui): implement reusable project card and projects grid page`

#### `app/components/admin/ProjectCard.tsx` *(new)*
- Built a reusable card matching the Figma spec for projects.
- Displays Title, dynamic ACTIVE/ARCHIVED badge (with light green `#dcfce7` background for active), and truncated descriptions.
- Includes three inline rows with `lucide-react` icons for `startDate`, `paymentType` and `memberCount`.
- Added a subtle `hover:-translate-y-1` transition scale effect for interactivity.

#### `app/api/admin/projects/route.ts` *(modified)*
- Added `_count: { select: { assignments: true } }` to the `GET` query to directly pass the member count to the UI card.

#### `app/admin/projects/page.tsx` *(new)*
- Created the main Admin Projects view aligned with the dashboard layout constraint (`max-w-7xl mx-auto`).
- Added a client-side search input field (`<Search />` icon) filtering by project name and description.
- Hooked up the "Add New Project" modal.
- Rendered projects inside a fluid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` layout.

### 2.7 Committed: `feat(ui): implement project detail page with team management and financials`

#### `app/admin/projects/[id]/page.tsx` *(new)*
- Created a comprehensive detail view including Header, Stat Cards (Revenue, Costs, Margin, ROI), and Team Table.
- Implemented "Add Member" functionality with `dailyHours`, `startDate`, and `endDate`.
- Real-time financial calculations for Estimated vs. Effective performance.
- Fixed Prisma client date validation issues by using raw SQL updates for assignment dates.
- Added "Edit Details" modal for projects, allowing updates to all project fields.

### 2.8 Committed: `feat(ui): implement project assignment gantt chart`

#### `app/admin/projects/[id]/gantt/page.tsx` *(new)*
- Built a custom SVG-based Gantt chart visualizing employee assignment timelines.
- Prioritizes per-assignment `startDate`/`endDate`, falling back to project bounds.
- Includes interactive tooltips showing assigned hours per day.

### 2.9 Committed: `feat(ui): implement financial projections page`

#### `app/admin/projections/page.tsx` *(new)*
- Implemented a global financial projections view.
- Visualizes monthly project revenue vs. cost trends using an SVG area chart.
- Includes a data table showing monthly breakdowns of totals and individual project contributions.

#### `app/api/admin/projections/route.ts` *(new)*
- API endpoint that aggregates all projects and assignments to project revenue/costs into a monthly time series.

### 2.10 Committed: `fix: refine cost and revenue calculations`

#### `app/admin/projects/[id]/page.tsx` *(modified)* & `app/api/admin/projections/route.ts` *(modified)*
- **Revenue source**: Strictly used `totalProjectPrice` as revenue.
- **Fixed Costs**: Ensured `totalFixedCost` is added as a baseline to both **Estimated** and **Effective** totals.
- **Labor costs**: Refined calculations for both Estimated (committed hours) and Effective (logged hours).
- **Project List**: Updated the projects overview grid to show the correct revenue value per card.

### 2.11 Committed: `fix: correct dashboard monthly revenue and sidebar cleanup`

#### `app/api/admin/dashboard/stats/route.ts` *(modified)*
- **Revenue Logic**: Replaced the incorrect employee-cost summation with a proper project-based revenue calculation.
- **Monthly Spreading**: It now correctly spreads `totalProjectPrice` over the project duration and estimates hourly revenue based on assignments for the current month.

#### `app/components/admin/SidebarNav.tsx` *(modified)*
- **Sidebar Cleanup**: Removed the placeholder "New Section" link from the admin sidebar.

---

## Step 3: Authentication (NextAuth / JWT) — 🔜 Pending

## Step 4: AI Chat Integration — 🔜 Pending
