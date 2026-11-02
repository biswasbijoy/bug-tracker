# UI conventions (client)

Read `docs/REDESIGN_PLAN.md` first for the product plan. This file is the "how to build a page" reference.

## Stack & layout of the code

Next.js 15 App Router · React 19 · Tailwind v4 · Zustand · Axios · react-hot-toast · Recharts · @hello-pangea/dnd · `@heroicons/react` · `date-fns`.

```
client/app/(app)/…            authenticated pages — AppShell (sidebar, session gate, data load) wraps them automatically
client/app/auth/page.tsx      login / register (outside the shell)
client/components/ui/         primitives (see list below)
client/components/layout/     shell: Sidebar, MobileNav/TopBar, NotificationsMenu, UserMenu
client/components/tickets/    ticket vocabulary + shared views (badges, filters, table, board, form dialog)
client/lib/tickets.ts         ★ statuses / stages / priorities / types / severities / environments, due-date helpers, sorting
client/lib/utils.ts           cn, formatDate, timeAgo, toDateInput, dateInputToIso, errorMessage, initials, pluralize …
client/store/workspaceStore.ts★ ONE cache: tickets, projects, epics, sprints, labels + every mutation
client/store/uiStore.ts       global "new/edit ticket" dialog, command palette, sidebar state
client/store/authStore.ts     user, login/logout, updateProfile
client/types/index.ts         normalised client types (ids, not populated objects)
```

## Data rules

* Pages are `'use client'` components. **Do not fetch tickets/projects/epics/sprints/labels yourself** — read them with
  `useWorkspace(s => s.tickets)` etc. (AppShell has already loaded them; pages render only once `loaded` is true) and mutate
  through the store (`createTicket`, `updateTicket(id, patch)`, `saveEpic`, `removeSprint`, …). The store updates optimistically and keeps
  the sidebar, board, palette and notifications in sync.
* Names for ids: `const { projectById, epicById, sprintById, labelByName, ticketById } = useLookups()`.
* Ticket calls that return a ticket (comments, checklist, attachments) go through `useWorkspace.getState().ticketAction(api.post(...))`
  (it normalises the response and replaces the ticket in the store). Import `api` from `@/services/api`.
* Empty string clears an optional ticket field (`epicId: ''`, `reminderDate: ''`). Dates from `<input type="date">` → `dateInputToIso(value)`; back → `toDateInput(iso)`.
* Pipeline: use `stageOf(status)`, `isDone(status)`, `isOpen(status)`, `isOverdue(t)`, `isDueToday(t)`, `daysUntilDue(t)` — never hard-code status lists.
  Legacy status `to-do` exists in data; `statusMeta()` handles unknown statuses safely.
* Errors: `try { … } catch (err) { toast.error(errorMessage(err, 'Could not …')) }`. Success toasts are short ("Epic created").
* Destructive actions use `ConfirmDialog` and say what else is affected. Deleting a **project** cascades (its tickets, epics, sprints are deleted) — show counts. Deleting an epic/sprint only detaches its tickets.
* Create/edit a ticket anywhere with `useUi.getState().openNewTicket({ projectId, epicId, sprintId, status, parentTicketId })` / `openEditTicket(ticket)`.

## Styling rules

* Use the semantic tokens as Tailwind utilities: surfaces `bg-canvas | bg-panel | bg-subtle`, borders `border-line | border-line-strong`,
  text `text-fg | text-fg-muted | text-fg-subtle`, `accent` (+`-soft`, `-hover`, `-fg`), `success|warning|danger|info` (+`-soft`).
  Hue palette for charts/chips: CSS vars `var(--c-gray|red|orange|amber|green|teal|blue|violet|pink)` (they switch with the theme).
  **No hard-coded hex colours** (except user-chosen project/label colours). Everything must look right in light **and** dark.
* No inline SVG path strings — use `@heroicons/react` (`/24/outline` for nav/large, `/20/solid` for small inline icons).
* Dense but calm: base text 14px, secondary 13px, meta 12px; radius `rounded-md` controls, `rounded-lg` panels; shadows only `shadow-sm` on panels.
* Mono font (`font-mono`) for ticket keys / versions.
* Layout: page = `<PageHeader title description breadcrumbs actions />` then content. Surfaces are `<Panel title actions flush>`.
  Content must work from 360px wide up: stack columns on mobile, tables become card lists (see `TicketTable` for the pattern), no horizontal page scroll.
* Touch targets ≥ 36px on mobile (Button `md`, IconButton `md`).
* Set the tab title: `useDocumentTitle('Page name')`.
* Any component using `useSearchParams()` must sit inside `<Suspense>` (see `app/(app)/tickets/page.tsx`).
* Accessibility: icon-only buttons need `label` (IconButton does), form fields need labels (Form components do), keep focus rings, dialogs are `Dialog`.

## Reusable pieces

`components/ui`: `Button` (variant primary|secondary|outline|ghost|danger, size sm|md|lg, `icon`, `loading`), `IconButton`, `Input`, `Textarea`, `Select` (native, `options`),
`Checkbox`, `Field`, `Badge` (tone), `Chip` (hue), `Avatar`, `Dialog`, `ConfirmDialog`, `Popover`, `Menu` (action/choice lists),
`Tabs` (underline), `Segmented`, `Panel`, `EmptyState`, `Skeleton`, `Spinner`, `ProgressBar`, `Kbd`, `PageHeader`, `CommandPalette` (already mounted).

`components/tickets`: `StatusPill` (pass `onChange` to make it a menu), `PriorityBadge`, `PriorityIcon`, `TypeIcon`, `TypeChip`, `SeverityChip`, `EnvironmentChip`,
`LabelChip`, `DueBadge`, `TicketKey`, **`TicketsWorkspace`** (`mode="list" | "board"`, `lock={{ projectId?, epicId?, sprintId? }}` — filters + grouped list or board, state in the URL),
`TicketTable`, `TicketBoard`, `TicketFormDialog` (mounted globally), `useTicketFilters`, `NewTicketFromQuery`.

Filter URL keys understood by `/tickets` and `TicketsWorkspace`: `q, scope(open|done|all), stage, status, priority, type, assignee, project, epic, sprint, label, starred(1), sort, group`.
Deep link example: `/tickets?epic=<id>&scope=all`.

## Working agreement for contributors on this redesign

* Only touch the files of your assignment. You may **add** exports/files to shared code, but don't change the behaviour of existing shared components — report what you'd change instead.
* Don't start dev servers (the maintainer verifies in the browser). Check your work with `cd client && npx tsc --noEmit` — ignore errors under `.next/types/` (stale generated files).
* Don't modify `server/`, don't commit, don't add npm dependencies.
* The previous UI is preserved in git history (`git show HEAD:client/app/<page>/page.tsx`) and in `.old-ui/` for reference of *behaviour* only — don't copy its styling.
