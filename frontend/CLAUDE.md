# CLAUDE.md

This file defines universal implementation rules for Claude/Coding agents in this repository.

## Scope

These rules apply to the entire repository unless a more specific instruction file exists in a subdirectory.

## UI and Design Rules

1. Always use **Material Symbols Rounded** for icons.
2. Always use existing components from `components/ui/*` before creating new primitives.
3. Prefer existing shared layouts and patterns from `components/shared/*` and `components/layouts/*`.
4. Never hardcode brand colors in component styles; always use theme CSS variables and semantic Tailwind tokens.
5. Use utility classes like `bg-primary`, `text-muted-foreground`, `border-border`, etc., instead of raw hex values.
6. Keep border radius, spacing, and typography aligned with tokens defined in `app/globals.css`.
7. Do not introduce a new visual style when an existing style/pattern already exists in the app.

## CSS and Theming Rules

1. Theme values must come from `:root` / `.dark` variables in `app/globals.css`.
2. If a new color/token is needed, add it to `app/globals.css` first, then consume it via semantic classes.
3. Avoid inline styles except for dynamic values that cannot be expressed via utility classes or tokens.
4. Support both light and dark themes for all new UI.

## Component and Code Quality Rules

1. Reuse existing types, utilities, and constants from `lib/*` before adding duplicates.
2. Keep components small and composable; extract repeated UI into reusable components.
3. Do not leave dead code, commented-out blocks, or unused imports.
4. Preserve strict TypeScript compatibility and avoid `any` unless unavoidable.

## Accessibility Rules

1. All interactive elements must be keyboard accessible.
2. Buttons and inputs must have clear labels or accessible names.
3. Ensure sufficient color contrast for text and controls in both themes.

## Data and Backend Rules

1. For Supabase changes, use migration files in `supabase/migrations`.
2. Never bypass RLS assumptions in app code; design queries/actions to respect role-based access.
3. Keep schema, policies, and app usage consistent when making data model changes.

## Operational Rules

1. Prefer editing existing files over adding new ones unless separation clearly improves maintainability.
2. Keep diffs minimal and focused on the requested task.
3. Run relevant lint/type checks after changes when possible.
