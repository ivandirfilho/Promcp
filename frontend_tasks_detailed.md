# Frontend Implementation Plan (Next.js + Tailwind)

**Agent**: UI (mcp-ui)
**Framework**: Next.js 14 (App Router)
**Styling**: Tailwind CSS + Lucide Icons

## Phase 1: Foundation (Scaffold)
1.  **Init Project**: `npx create-next-app@latest frontend --typescript --tailwind --eslint`
2.  **Dependencies**: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `clsx`, `tailwind-merge`.
3.  **Environment**: `.env.local` with Supabase URL/Anon Key.

## Phase 2: Core Components (The Shell)
4.  **Supabase Client**: Singleton in `lib/supabase/client.ts` and `server.ts`.
5.  **Auth Provider**: Context for Session management.
6.  **Layout**:
    -   `Sidebar`: Navigation (Dashboard, Store, Settings).
    -   `TopBar`: User Menu + **HeartbeatIndicator** (Realtime Pulse).

## Phase 3: Features & User Stories

### Feature: Catalog Browse (Store)
-   **Page**: `/store`
-   **Logic**: Fetch `mcp_catalog` via Server Component.
-   **UI**: Grid of `CatalogCard`.
-   **Interaction**: Click -> Open `InstallModal`.

### Feature: Installation Flow
-   **Component**: `InstallModal` with `KeyInputForm`.
-   **Inputs**:
    -   `Brave API Key` (Password field).
    -   `Google JSON Path` (Text).
    -   `Install Dir` (Text).
-   **Action**: `supabase.insert('user_installations')`.

### Feature: Dashboard (My Apps)
-   **Page**: `/dashboard` (Home).
-   **Realtime**: Subscribe to `user_installations` (UPDATE/INSERT).
-   **Status Map**:
    -   `pending` -> ⏳ Queueing
    -   `installing_dependencies` -> 📦 Installing...
    -   `installed` -> 🟢 Active
-   **Actions**: Uninstall (UPDATE status = 'uninstalling').

### Feature: System Health
-   **Component**: `HeartbeatWidget`.
-   **Logic**: Poll/Subscribe `agent_heartbeats`.
-   **Visual**: Green Dot (Online) / Red Dot (Offline).

## Phase 4: Polish
-   **Glassmorphism**: Backdrop blur on Cards/Modals.
-   **Animations**: Transitions between states.
