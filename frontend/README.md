# eLibrary Developer Docs

## Docs Index

| Document                                    | Scope                                                                                |
| :------------------------------------------ | :----------------------------------------------------------------------------------- |
| [System Architecture](docs/ARCHITECTURE.md) | Architecture overview, folder structure, auth flow, file uploads, and notifications. |
| [Database & Schema](docs/DATABASE.md)       | Database tables, triggers, functions, RLS policies, and storage setup.               |
| [Security & Auth](docs/SECURITY.md)         | User roles, grade-based access rules, session cookies, and default passwords.        |
| [Deployment & Operations](docs/SETUP.md)    | Local setup, Supabase stack, running migrations, Docker build, and tests.            |

---

## Tech Stack

| Layer       | Component           | Version             | Notes                                                                             |
| :---------- | :------------------ | :------------------ | :-------------------------------------------------------------------------------- |
| Runtime     | Node.js             | `>= 20.0.0`         | Linux / macOS / Windows (Docker uses `node:22-bookworm`)                          |
| Framework   | Next.js             | `16.1.6`            | App Router, React Server Components (RSC), and Server Actions                     |
| UI Runtime  | React               | `19.2.3`            | Client component hydration, hooks, and context providers                          |
| Language    | TypeScript          | `^5`                | Strict mode enabled, compiled via `tsc` (`tsconfig.json`)                         |
| Database    | PostgreSQL          | `15+`               | Supabase managed, port `54322`, `pgcrypto` + `pg_trgm` extensions                 |
| Client SDK  | Supabase JS         | `^2.97.0`           | `@supabase/ssr` (`^0.8.0`) cookie-based auth and PostgREST client                 |
| File Upload | TUS Protocol        | `^4.3.1`            | Resumable upload via `tus-js-client` with 6MB chunks                              |
| PDF Engine  | EmbedPDF            | `^2.7.0`            | Canvas rendering, annotations, and Range request streaming (`pdfjs-dist 4.4.168`) |
| UI & Tokens | Radix UI / Tailwind | `^1.4.3` / `^4.2.1` | Headless primitives, `@tailwindcss/postcss`, theme CSS variables                  |
| Icons       | Material Symbols    | `^5.2.36`           | `@fontsource/material-symbols-rounded` iconography                                |
| Testing     | Vitest              | `^4.0.18`           | React Testing Library (`^16.3.2`), JSDOM (`^28.1.0`) test runner                  |

---

## Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd elibrary

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Create local env file
cp .env.example .env.local

# 4. Start local Supabase
supabase start

# 5. Run database migrations
supabase db reset

# 6. Check TypeScript types
pnpm typecheck

# 7. Start dev server
pnpm dev
```

Open `http://localhost:3000` in your browser.

---

## Environment Variables

| Variable                                       | Scope         | Required | Default / Example                   | Description                                           |
| :--------------------------------------------- | :------------ | :------: | :---------------------------------- | :---------------------------------------------------- |
| `NEXT_PUBLIC_APP_NAME`                         | Client/Server |    No    | `e-library`                         | App name shown in the UI                              |
| `NEXT_PUBLIC_APP_URL`                          | Client/Server |   Yes    | `http://localhost:3000`             | App URL for redirects and links                       |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Client/Server |   Yes    | `http://127.0.0.1:54321`            | Supabase API and Auth URL                             |
| `INTERNAL_SUPABASE_URL`                        | Server-only   |    No    | `http://host.docker.internal:54321` | Internal Docker URL for Supabase (if inside Docker)   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Client/Server |   Yes    | `sb_publishable_...`                | Supabase public anon key (browser-safe)               |
| `SUPABASE_SECRET_KEY`                          | Server-only   |   Yes    | `sb_secret_...`                     | Supabase service role key (server-only, bypasses RLS) |

---

## Folder Structure

```text
.
├── app/                  # Next.js App Router
│   ├── admin/            # Admin portal (approvals, users, settings)
│   ├── student/          # Student portal (library, PDF reader viewer)
│   ├── teacher/          # Teacher portal (uploads, student analytics)
│   └── actions.ts        # Core auth & session server actions
├── components/           # UI components
│   ├── layouts/          # Role-based shell layouts
│   ├── providers/        # AuthProvider & theme context
│   ├── shared/           # Header, sidebar, notifications, PDF viewer
│   └── ui/               # Reusable primitives (buttons, inputs, dialogs)
├── docs/                 # Developer documentation
├── lib/                  # Shared utilities and server actions
│   ├── actions/          # Server actions (upload, viewer, notifications)
│   ├── hooks/            # Custom hooks (realtime notifications, search)
│   └── supabase/         # Supabase client, server, admin, & middleware
├── supabase/             # Database migrations & SQL schema
└── __tests__/            # Unit & integration tests
```

---

## Available Scripts

```bash
pnpm dev             # Start development server
pnpm build           # Build production bundle
pnpm start           # Run production server (.next/standalone)
pnpm typecheck       # Check TypeScript types
pnpm lint            # Run ESLint
pnpm lint:fix        # Auto-fix ESLint issues
pnpm format          # Format code with Prettier
pnpm test            # Run tests once
pnpm test:watch      # Run tests in watch mode
pnpm test:ui         # Open Vitest UI
```
