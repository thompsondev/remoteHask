# UI design (Pencil)

Operator-console layouts live in [`design.pen`](./design.pen) and are implemented under `src/` with **HeroUI**, **shadcn/ui**, and Tailwind tokens from [`src/app/globals.css`](./src/app/globals.css).

## Prerequisites

1. Install the [Pencil](https://pencil.dev) extension in Cursor.
2. Complete Pencil activation (email).
3. Log in to Claude Code: `claude` (required for Pencil MCP).
4. Confirm **Settings → Tools & MCP** lists Pencil when `design.pen` is open.

Docs: [Installation](https://docs.pencil.dev/getting-started/installation) · [AI integration](https://docs.pencil.dev/getting-started/ai-integration)

## Starter screens

| Frame in `design.pen` | App route | Code to align with |
|-----------------------|-----------|-------------------|
| `Screen / Login` | `/login` | `src/features/auth/components/login-form.tsx` |
| `Screen / Devices` | `/dashboard/devices` | `src/features/devices/`, `dashboard-sidebar.tsx` |

Nav labels match `dashboard-sidebar.tsx`: Overview, Devices, Sessions, Settings.

## Workflow

1. Open `apps/frontend/design.pen` in Cursor (Pencil canvas).
2. Iterate in Pencil or via chat, e.g. “Polish the Devices table and add an empty state.”
3. Implement in code, e.g. “Implement changes from `design.pen` Screen / Devices using existing `Card`, `Button`, and `devices-table.tsx`.”
4. Commit `design.pen` with related UI changes so design and code stay in sync.

## Optional: shadcn design system in Pencil

Pencil ships a full shadcn component library (`pencil-shadcn.pen` in the extension). To use it as a reference, duplicate that file into this folder or import components into `design.pen` via Pencil’s UI.

## Map design → implementation

| Design area | Implementation |
|-------------|----------------|
| Colors / radius | `src/app/globals.css` (`:root` CSS variables) |
| Primitives | `src/components/ui/*` |
| Layout shell | `src/app/(dashboard)/layout.tsx`, `dashboard-sidebar.tsx` |
| Feature UI | `src/features/*` |
