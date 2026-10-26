# System Architecture

This document explains how the eLibrary platform works, how data flows between the client and server, and how core features (auth, uploads, PDF viewing, realtime notifications) are implemented.

---

## 1. High-Level Architecture

The platform is a full-stack Next.js 16 application backed by Supabase for authentication, PostgreSQL database, file storage, and realtime WebSocket notifications.

```mermaid
graph TB
    subgraph Client["Browser Client (React 19)"]
        UI["Next.js Pages & Components"]
        Viewer["EmbedPDF Canvas Viewer"]
        RTClient["Supabase Realtime Client"]
    end

    subgraph Server["Next.js Server (Node.js 22)"]
        Middleware["proxy.ts / Middleware (Session Refresh)"]
        Actions["Server Actions (lib/actions & app/*/actions)"]
        ServerClient["@supabase/ssr Server Client"]
    end

    subgraph Supabase["Supabase Backend"]
        Auth["GoTrue Auth (JWT & Cookies)"]
        DB[("PostgreSQL 15 (Data & RLS)")]
        Storage["Storage (library-files S3 bucket)"]
        Realtime["Realtime Engine (WebSockets)"]
    end

    UI -->|"HTTP / Server Actions"| Middleware
    Middleware --> Actions
    Actions --> ServerClient
    ServerClient -->|"Queries / Mutations"| DB
    ServerClient -->|"Verify Session"| Auth

    Viewer -->|"Signed URL Range Requests"| Storage
    UI -->|"Direct TUS Resumable Upload"| Storage
    RTClient -->|"WebSocket Listeners"| Realtime
    DB -.->|"postgres_changes triggers"| Realtime
```

---

## 2. Folder Structure

Here is how the project is organized:

```text
app/                      # Next.js App Router
├── admin/                # Admin portal: approvals, library, users, reports, settings
├── student/              # Student portal: grade library, bookmarks, recent, PDF viewer
├── teacher/              # Teacher portal: upload materials, student roster, analytics
├── actions.ts            # Core server actions: login, signOut, profile, changePassword
└── globals.css           # Tailwind CSS theme variables and styles

components/               # React UI Components
├── admin/                # Admin dialogs, tables, metrics cards
├── student/              # Book cards, grade filters, subject carousels
├── teacher/              # Upload modal, review lists
├── shared/               # Header, sidebar, notification center, PDF viewer wrappers
├── layouts/              # Role-specific layouts (AdminLayout, StudentLayout, etc.)
├── providers/            # AuthProvider (session state & route guards)
└── ui/                   # Reusable UI components (buttons, inputs, dialogs)

lib/                      # Core Business Logic & Utilities
├── actions/              # Shared server actions (upload, viewer, reading-progress, notifications)
├── constants/            # Subjects list, navigation links, defaults
├── context/              # React contexts (AuthContext, UploadContext)
├── hooks/                # Custom hooks (useRealtimeNotifications, useSearch, etc.)
├── supabase/             # Supabase clients (client.ts, server.ts, admin.ts, middleware.ts)
└── types/                # TypeScript types

docs/                     # Developer guides (architecture, database, security, setup)
supabase/                 # Supabase configuration and SQL migrations
```

---

## 3. Authentication & Routing

### Auth Flow & Role Redirects

Authentication uses Supabase Auth with server-side cookie management (`@supabase/ssr`).

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Middleware as Middleware (proxy.ts)
    participant Auth as Supabase Auth
    participant Page as Portal Page / Layout
    participant AuthProvider as Client AuthProvider

    User->>Middleware: Request page (e.g. /student, /teacher, /admin)
    Middleware->>Auth: Check session cookies (getUser)

    alt Session Valid & hitting login page ("/")
        Middleware->>User: Redirect to portal (/student, /teacher, or /admin based on role)
    else Session Invalid & Token Expired
        Middleware->>User: Clear cookies & redirect to login ("/")
    else Valid Session
        Middleware->>Page: Allow request with refreshed session cookies
    end

    Page->>AuthProvider: Mount application tree
    AuthProvider->>Auth: onAuthStateChange listener
    alt User logs out or session revoked
        AuthProvider->>User: Redirect to login ("/")
    end
```

### User Portals

Users belong to one of three roles, defined in `public.app_role`:

| Role        | Portal Root | Purpose                                                                                              |
| :---------- | :---------- | :--------------------------------------------------------------------------------------------------- |
| **Student** | `/student`  | Access curriculum books for their grade, track reading progress, take notes, bookmark materials.     |
| **Teacher** | `/teacher`  | Upload resources for students, view student reading analytics, track upload approval status.         |
| **Admin**   | `/admin`    | Approve/reject teacher uploads, manage user accounts, send school-wide announcements, adjust grades. |

---

## 4. File Upload Flow

PDFs are uploaded directly from the browser to Supabase Storage using the **TUS resumable upload protocol**, instead of passing large files through the Next.js server:

```mermaid
sequenceDiagram
    autonumber
    actor Uploader as Teacher or Admin
    participant Action as Server Action (lib/actions/upload.ts)
    participant Storage as Supabase Storage (library-files)
    participant DB as PostgreSQL Database

    Uploader->>Action: Request upload token & unique resource ID
    Action-->>Uploader: Ephemeral JWT token + Resource UUID

    Uploader->>Storage: Stream PDF chunks directly (TUS Protocol, 6MB chunks)
    Storage-->>Uploader: Upload complete (204 No Content)

    Uploader->>Action: saveUploadMetadata({ resourceId, title, subjectId, grade, type... })
    Action->>DB: INSERT into public.resources & public.resource_grade_access

    alt Uploader is Admin
        Note over DB: published = true (Instantly live)
    else Uploader is Teacher
        Note over DB: published = false (Pending Admin Review)
        DB->>DB: Trigger fires notification to all Admins
    end

    Action-->>Uploader: Success response
```

---

## 5. PDF Viewer & Reading Progress

### PDF Streaming

All study materials are stored in the private `library-files` storage bucket.

1. When a student opens `/student/viewer/[id]`, the server creates a **temporary signed URL** valid for 1 hour.
2. The browser renders the PDF using `@embedpdf/*` (using `pdfjs-dist`).
3. The viewer streams only the pages currently being viewed using HTTP range requests (`bytes=start-end`), keeping bandwidth low and initial load times fast.

### Reading Progress & Notes

- **Reading Progress**: As the student scrolls through pages, the viewer debounces progress updates (every 2 seconds of inactivity) and updates `last_page` and `progress_pct` in `public.reading_progress`.
- **Annotations & Notes**: Students can highlight text, draw boxes, and save sticky notes on specific pages. These are serialized as JSON and stored in `public.resource_annotations`.

---

## 6. Realtime Notifications

The platform updates users in real time using **Supabase Realtime** (listening for changes on the `notifications` table):

```mermaid
flowchart TD
    A["Event Occurs in Database"] --> B{"Event Type"}

    B -->|"Teacher uploads PDF"| C["Trigger: trg_notify_admins_on_upload"]
    C --> D["Creates notification for all Admins: 'New Upload Pending Review'"]

    B -->|"Admin approves PDF"| E["Trigger: trg_notify_teacher_on_approval"]
    E --> F["Creates notification for Uploader: 'Upload Approved'"]

    B -->|"Resource goes live"| G["Trigger: trg_students_on_resource_approval"]
    G --> H["Creates notifications for students in matching grade: 'New Material Added'"]

    B -->|"Admin broadcasts announcement"| I["RPC: send_announcement()"]
    I --> J["Creates notifications for target audience (All / Students / Teachers)"]

    D --> K[("public.notifications table")]
    F --> K
    H --> K
    J --> K

    K -->|"Supabase Realtime WebSocket"| L["Client Hook: useRealtimeNotifications(userId)"]
    L --> M["Header Notification Bell Badge updates instantly"]
```

Clients subscribe to their personal notification channel:

```typescript
supabase
  .channel(`notifications:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      // Updates badge count and appends to notification dropdown
    },
  )
  .subscribe();
```
