# Local Setup & Development

## 1. Prerequisites

Make sure you have these installed:

```bash
node -v      # Node >= 20.0.0 (Node 22 LTS recommended)
pnpm -v      # pnpm >= 9.0.0
docker -v    # Docker Engine >= 24.0.0
supabase -v  # Supabase CLI >= 2.76.0
```

---

## 2. Environment Configuration

Create a `.env.local` file in the project root:

```ini
# Application Configuration
NEXT_PUBLIC_APP_NAME=e-library
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Local Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SECRET_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz

# Internal URL override (only needed when running inside Docker)
# INTERNAL_SUPABASE_URL=http://host.docker.internal:54321
```

### Environment Variables

| Variable                                       | Scope         | Required | Default / Example                   | Description                                      |
| :--------------------------------------------- | :------------ | :------: | :---------------------------------- | :----------------------------------------------- |
| `NEXT_PUBLIC_APP_NAME`                         | Client/Server |    No    | `e-library`                         | App name shown in the UI                         |
| `NEXT_PUBLIC_APP_URL`                          | Client/Server |   Yes    | `http://localhost:3000`             | App URL for redirects                            |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Client/Server |   Yes    | `http://127.0.0.1:54321`            | Supabase API and Auth URL                        |
| `INTERNAL_SUPABASE_URL`                        | Server-only   |    No    | `http://host.docker.internal:54321` | Internal Supabase URL when running inside Docker |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Client/Server |   Yes    | `sb_publishable_...`                | Supabase public anon key                         |
| `SUPABASE_SECRET_KEY`                          | Server-only   |   Yes    | `sb_secret_...`                     | Supabase service role secret key (server-only)   |

---

## 3. Local Supabase Setup

### 3.1 Start Supabase

```bash
supabase start
```

When it finishes starting, you will see:

- **API URL:** `http://127.0.0.1:54321`
- **PostgreSQL Connection:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Studio Dashboard:** `http://127.0.0.1:54323`
- **Inbucket (Email testing):** `http://127.0.0.1:54324`

### 3.2 Run Database Migrations

Run migrations using the Supabase CLI:

```bash
# Reset database and run all migrations
supabase db reset

# OR apply manually against local PostgreSQL via psql:
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/schema.sql
```

### 3.3 Check Storage Bucket

Make sure the `library-files` bucket exists:

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'library-files';
```

Expected record:

```text
 id            | name          | public | file_size_limit | allowed_mime_types
---------------+---------------+--------+-----------------+--------------------
 library-files | library-files | f      |       104857600 | {application/pdf}
```

---

## 4. Running the App

### 4.1 Install Dependencies

```bash
pnpm install --frozen-lockfile
```

### 4.2 Start Dev Server

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

### 4.3 Type Checking & Linting

```bash
# Check TypeScript types
pnpm typecheck

# Run linter
pnpm lint

# Format code
pnpm format
```

---

## 5. Running Tests

Tests are written with Vitest, React Testing Library, and JSDOM.

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Open Vitest UI
pnpm test:ui
```

### Test Folder Structure

```text
__tests__/
├── __mocks__/        # Supabase client and Next.js router mocks
├── admin/            # Admin actions, approvals, users, and settings tests
├── lib/              # Upload actions, utilities, and helper tests
├── student/          # Student library, bookmark, and viewer tests
├── teacher/          # Teacher dashboard, uploads, and student visibility tests
└── setup.ts          # Vitest global test setup
```

---

## 6. Running with Docker

You can also build and run the app with Docker:

### 6.1 Build the Image

```bash
docker build -t elibrary:latest .
```

### 6.2 Run the Container

```bash
docker run -d \
  --name elibrary-instance \
  -p 3000:3000 \
  --env-file .env.docker \
  --add-host=host.docker.internal:host-gateway \
  elibrary:latest
```

### 6.3 Dockerfile Stages

| Stage     | Base Image         | Operations                                                                                            |
| :-------- | :----------------- | :---------------------------------------------------------------------------------------------------- |
| `base`    | `node:22-bookworm` | Base Linux OS & Node runtime                                                                          |
| `deps`    | `base`             | Global pnpm install, copy package manifests, `pnpm install --frozen-lockfile`                         |
| `builder` | `deps`             | Copy repository source, inject `.env.docker`, execute `pnpm run build`                                |
| `runner`  | `base`             | Create unprivileged system user `nextjs:nodejs` (UID 1001), copy `.next/standalone`, expose port 3000 |
