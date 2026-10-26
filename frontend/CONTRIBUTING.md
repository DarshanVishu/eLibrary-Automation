# Contributing to eLibrary

Thank you for your interest in contributing to the eLibrary project! We welcome contributions from the community to help make this platform better for students, teachers, and administrators.

## 🛠️ Development Guidelines

### Coding Standards

We follow strict coding standards to maintain consistency across the codebase. Please refer to [AGENTS.md](AGENTS.md) for detailed implementation rules.

- **TypeScript**: Use strict TypeScript and avoid using `any`.
- **UI/UX**: Always use **Material Symbols Rounded** for icons via the `<Icon>` component in `components/ui/icon.tsx`. Register any new icon names in the `ICONS` map there before use.
- **Theming**: Use semantic CSS tokens (e.g., `bg-primary`, `text-muted-foreground`) and theme variables from `app/globals.css`.
- **Server Actions**: All data mutations must live in `'use server'` files under `lib/actions/` or `app/<role>/actions.ts`. Use `requireAuth('<role>')` to enforce authorization at the top of every admin/teacher action.
- **Accessibility**: Ensure all interactive elements are keyboard accessible and have sufficient color contrast.

### Component Structure

- Keep components small and composable.
- Role-specific components live in `components/<role>/` (e.g., `components/admin/`).
- Shared cross-role components live in `components/shared/`.
- Extract repeated UI into reusable components rather than duplicating JSX.
- Use Next.js App Router patterns — Server Components by default, `'use client'` only when browser APIs or React state are required.

## 🚀 Workflow

### 1. Branching Strategy

- `main`: Stable production branch.
- `develop`: Integration branch for in-progress features (if applicable).
- Feature branches: `feature/your-feature-name`
- Bug fix branches: `fix/issue-description`

### 2. Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation-only changes
- `style`: Formatting changes (no logic change)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or correcting tests

### 3. Pull Request Process

1. Create a new branch for your changes.
2. Ensure your code follows the project's styling and linting rules:
   ```bash
   pnpm format
   pnpm lint
   ```
3. Submit a Pull Request with a clear description of the changes and the problem they solve.
4. Ensure all CI checks pass before requesting a review.

## 🗄️ Database Changes

- All schema changes **must** be committed as timestamped SQL migration files in `supabase/migrations/`.
- **Never edit a migration that has already been applied** to any shared environment. Create a new one instead.
- After adding migrations, update `supabase/schema.sql` to reflect the full current state (see below).
- Never bypass RLS assumptions in application code. All writes from server actions must either use the service-role client (for trusted fan-out operations) or go through RLS-enforcing policies.
- Keep DDL, RLS policy updates, and required backfills in the same migration when they are logically coupled.

### Updating `supabase/schema.sql`

`supabase/schema.sql` is a **consolidated, human-readable snapshot** of the entire live schema. It is **not** executed by CI — it exists so developers can understand the full schema at a glance and provision new environments manually.

After adding any new migration:

1. Append the new SQL (as a clearly labelled part) to `supabase/schema.sql`.
2. Update the migration history table in `README.md`.

### Service-Role Client vs. Authenticated Client

| Use case                                               | Client                                                |
| ------------------------------------------------------ | ----------------------------------------------------- |
| Trusted fan-out inserts (notifications, announcements) | `getServiceRoleClient()` from `lib/supabase/admin.ts` |
| All other server actions                               | `createClient()` from `lib/supabase/server.ts`        |

The service-role client bypasses RLS and has **no `auth.uid()` context**. Do not call `auth.uid()`-dependent DB functions (e.g., `is_admin()`) from service-role-called RPCs — enforce authorization in the server action itself using `requireAuth()`.

### Notifications & Realtime

- The `notifications` table is subscribed to Supabase Realtime via `alter publication supabase_realtime add table public.notifications`.
- New notification types must be added to the `type` check constraint in the migration **and** to the `NotificationType` union in `lib/actions/notifications.ts`.
- Fan-out inserts (sending to many users at once) should use a `security definer` RPC function called via the service-role client to avoid N+1 round trips.

### RPC Functions

When adding a new RPC:

1. Write the function in a new migration file.
2. Export a typed server action in `lib/actions/` that calls `supabase.rpc(...)`.
3. If the function is called by authenticated users directly, `grant execute on function ... to authenticated;` in the migration.
4. If called via the service-role client only, no grant is needed.

## 📞 Communication

If you find a bug or have a feature request, please open an issue in the repository.

---

By contributing to this project, you agree to abide by our code of conduct.
