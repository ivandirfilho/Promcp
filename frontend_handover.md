# Frontend Technical Handover & Audit Report

**Status**: ✅ AUDITED & APPROVED
**Ready for**: Agent UI (Frontend Development)
**Backend Version**: Pro (v1.0.0 Integrated)
**Database**: Schema v1 (Active)

---

## 1. System Integration Points (The API)

The Frontend interacts exclusively via **Supabase Client**. No direct HTTP calls to the Engine are required.

### A. Core Data Models (Ready to Consume)

**1. Catalog (Marketplace)**
*   **Source**: Table `public.mcp_catalog`
*   **Access**: Public Read-Only.
*   **Fields**:
    *   `id` (UUID)
    *   `name` (Display Name)
    *   `description` (Short text)
    *   `logo_url` (Image)
    *   `category` (Filter tag)

**2. User Installations (State Control)**
*   **Source**: Table `public.user_installations`
*   **Access**: Authenticated User (CRUD Own Rows).
*   **Fields**:
    *   `status`: The Driver of the UI.
    *   `config_json`: Configuration content.
    *   `error_log`: Failure reasons.

**3. Engine Heartbeat (System Health)**
*   **Source**: Table `public.agent_heartbeats`
*   **Logic**:
    *   Query `WHERE user_id = auth.uid()`
    *   Check `last_seen`.
    *   **Rule**: If `time_since(last_seen) > 60s`, System is **OFFLINE**.
    *   **Rule**: If `< 60s`, System is **ONLINE**.

---

## 2. Interactive Flows (UX Instructions)

### Flow 1: Install New Tool
1.  User selects item in Catalog.
2.  Frontend executes:
    ```typescript
    supabase.from('user_installations').insert({
      user_id: user.id,
      catalog_id: item.id,
      status: 'pending', // REQUIRED TRIGGER
      mcp_server_name: item.name
    })
    ```
3.  **UI Feedback**: Change button to "Waiting Engine...".

### Flow 2: Realtime Progress (The "Matrix" Effect)
Frontend **MUST** subscribe to `user_installations` updates.
Mapping Status to UI:
*   `pending` ➔ 🕒 "Queueing"
*   `validating` ➔ 🔍 "Validating Environment"
*   `preparing_workspace` ➔ 📂 "Preparing Files"
*   `installing_dependencies` ➔ 📦 "NPM Install (This may take time)"
*   `configuring_json` ➔ ⚙️ "Configuring MCP"
*   `installed` ➔ ✅ "Ready" (Green)
*   `failed` ➔ ❌ "Error" (Red - Show `error_log` in tooltip)

### Flow 3: Uninstall
1.  User clicks "Uninstall".
2.  Frontend executes:
    ```typescript
    supabase.from('user_installations')
      .update({ status: 'uninstalling' })
      .eq('id', installationId)
    ```
3.  Wait for Backend to delete row OR set status to `removed`.

---

## 3. Design Guidelines (Aesthetics)
*   **Theme**: Dark Mode Default (Cyber/Hacker Aesthetics but Clean).
*   **Framework**: React + Vite (Use Branch `mcp-ui`).
*   **Styling**: Validated "Premium" look (Glassmorphism cards, Neon accents for Status).
*   **Components**:
    *   `StatusBadge`: Dynamic color based on Enum.
    *   `ConsoleLog`: Optional visualizer for `installation_logs` if implemented.

## 4. Audit Verification
*   ✅ Backend Listener is Active on `INSERT` events.
*   ✅ Status Transition Logic is implemented in `backend/src/core/sync.js`.
*   ✅ Database Permissions (RLS) allow Frontend interaction.

**VERDICT**: The system is fully ready for the Frontend interface.
