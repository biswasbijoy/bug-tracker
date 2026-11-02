# SQA Ticket Tracker — Redesign Plan

Goal: turn the current page-per-feature prototype into a coherent, fast, keyboard-friendly ticket tracker
for a QA/dev workflow, **without losing or migrating any data in the local MongoDB**
(`mongodb://localhost:27017/ticket-tracker`). No shared/remote database is used anywhere.

## 1. What exists today (audit)

Stack: Next.js 15 (App Router) + Tailwind v4 + Zustand + Axios; Express + Mongoose + JWT; local MongoDB.
Data model: User, Project, Epic, Sprint, Ticket (with embedded checklist/comments/activityLogs), Note, Label.
Live data: 2 users, 4 projects, 3 epics, 7 tickets (0 sprints/notes/labels).

### Problems found

| Area | Problem |
|------|---------|
| UX | **No ticket detail page.** The same view/edit/comment/checklist code is copy-pasted into `tickets`, `epics` and `projects/[id]` pages (~650 lines each). |
| UX | 10 flat sidebar entries; Labels, Epics, Sprints, Notifications are top-level although they are secondary. |
| UX | "Notifications" is a client-only fake store; the header bell always shows a red dot. |
| UX | 16 statuses shown flat everywhere; no notion of a pipeline stage (Todo → In progress → QA → Release → Done). |
| UI | Generic blue SaaS look, inline SVG path strings everywhere, status CSS classes that don't match real statuses (`status-to-do`, `status-qa` …). |
| Data | A ticket exists with status `to-do`, which is **not in the server enum** → `save()` on it (e.g. favourite toggle) throws a validation error. |
| Data | `ticketNo` is `QA-${count+1}`; deleting a ticket produces duplicates (numbers are per account, so today's two `QA-1`s are in different accounts, but deleting e.g. QA-3 of 5 makes the next ticket `QA-5` again). |
| API | Update/create spread `req.body` into the document (mass assignment: client can overwrite `userId`, `activityLogs`…). |
| API | Search builds a regex from raw user input (ReDoS / invalid-regex 500). `sort=priority` sorts alphabetically. |
| API | Empty `""` ObjectId fields cause 500s; clearing an epic/sprint on a ticket is impossible. |
| API | Activity log only records status changes. Comments/activity have no author name. Deleting a project leaves orphaned epics/tickets. |
| UX | **No `<Toaster/>` was mounted**, so every success/error toast in the old UI was invisible. |
| UX | Reports' weekly chart used hard-coded fake numbers; Settings → Profile/Notifications saved nothing. |
| UX | A wrong password on the login form triggered a full page reload that wiped the error message. |
| Files | Upload dir resolves to a folder **outside** the repo while Express serves `repo/uploads`; attachments are never shown. |

## 2. Principles

1. **Data first**: additive schema changes only (new optional fields / looser enums). No destructive migration. Backup before any work (`data/backups/…`, git-ignored).
2. **One source of truth** for ticket vocabulary (`client/lib/tickets.ts`): statuses, stages, priorities, types, colours, icons.
3. **One component per concept**: one ticket form, one ticket detail, one list, one board, one epic panel, one sprint panel — reused by global pages and by project tabs.
4. **Deep-linkable**: every ticket has a URL (`/tickets/:id`); filters live in the query string.
5. **Dense, calm, keyboard-first** (Linear/Plane-style), light + dark, responsive down to phone width.

## 3. Information architecture

```
Sidebar
  Home                 /dashboard      my work: due / overdue / blocked / QA queue, activity
  Tickets              /tickets        list (group + sort + filters, saved in URL), quick add
  Board                /board          kanban: group by Stage (5 cols) or Status (all)
  Calendar             /calendar       due dates, deployments, production dates
  Reports              /reports        throughput, status/priority/type mix, aging, per project
  ── Projects ──       /projects       project list in sidebar (colour dots) → /projects/:id
  ── Planning ──
  Epics                /epics
  Sprints              /sprints
  ── bottom ──
  Notes                /notes
  Settings             /settings       Profile · Appearance · Labels · Data & shortcuts
Header (per page)      breadcrumb · title · actions;   global: ⌘K palette, bell (derived alerts), "New ticket"
Project workspace      /projects/:id   tabs: Overview · Tickets · Board · Epics · Sprints · Activity
Ticket detail          /tickets/:id    2-column: content + properties
```

Removed routes: `/labels` (→ Settings), `/notifications` (→ bell popover with *real* alerts derived from tickets),
`components/projects/*Tab` and the 3 duplicated ticket modals.

### Pipeline stages (derived from the existing 16 statuses — no data change)

| Stage | Statuses |
|-------|----------|
| Todo | open, backlog, ready, reopened, to-do *(legacy)* |
| In progress | in-progress, code-review, blocked *(flagged red)* |
| QA | ready-for-qa, qa-in-progress, qa-failed |
| Release | ready-for-release, stage, released |
| Done | done, closed, cancelled |

Dragging a card onto a stage column sets that stage's primary status; the Status grouping lets you drop onto exact statuses.

## 4. Design system

* Tokens (CSS variables → Tailwind v4 `@theme inline`): `bg, panel, subtle, line, line-strong, fg, fg-muted, fg-subtle, accent(+hover/soft/fg), success|warning|danger|info (+soft)`, radius 8/10/14, 3 shadow levels. Light and dark.
* Type: Inter (UI, 13–14 px base), JetBrains Mono (ticket keys, versions). Icons: `@heroicons/react` (no inline SVG paths).
* Primitives (`components/ui`): Button, IconButton, Input, Textarea, Select, Checkbox, Badge, Avatar, SegmentedControl, Tabs, Dialog, ConfirmDialog, Popover/Menu, Tooltip, CommandPalette, EmptyState, Skeleton, ProgressBar, Kbd, PageHeader.
* Ticket components (`components/tickets`): StatusPill (+ inline status menu), PriorityIcon, TypeIcon, TicketRow, TicketList, TicketBoard, TicketFilters, TicketFormDialog, TicketDetail.
* Shell (`components/layout`): AppShell, Sidebar, MobileNav, TopBar, NotificationsMenu, UserMenu.

## 5. Server changes (all backwards-compatible)

1. `Ticket.status` enum accepts legacy `to-do`.
2. `ticketNo` = next free `QA-n` (max suffix + 1), not `count + 1`. Existing numbers are never rewritten.
3. Whitelisted create/update fields; `""`/`null` for `epicId|sprintId|parentTicketId` unsets the field.
4. Escaped search regex; priority sort by rank.
5. Activity log for title, status, priority, severity, type, environment, assignee, epic, sprint, due date, release info; "created" entry.
6. Single-ticket mutations return the populated ticket; comments/activity populate author name; delete-comment endpoint.
7. Cascade rules: delete project → delete its epics/sprints/tickets (UI shows counts); delete epic/sprint → unset on tickets.
8. `PUT /auth/me` (name) and `PUT /auth/password`.
9. Attachments: fix upload dir, `POST/DELETE /tickets/:id/attachments`.

## 6. Delivery phases (all done — see README for the resulting feature list)

0. Safety: `mongodump` backup; test against a **cloned** DB (`ticket-tracker-redesign-test`) on ports 5100/3100 — never the live DB.
1. Server hardening (§5).
2. Foundation: tokens, domain config, primitives, shell, stores.
3. Shared ticket components + ticket detail + tickets list + board.
4. Pages: dashboard, projects (+workspace), epics, sprints, calendar, reports, notes, settings, auth.
5. Verify in browser (desktop/mobile, light/dark), `tsc` + `next build`, update README, delete test DB.

## 7. Out of scope (possible next steps)

Multi-user collaboration / assignees as users, real-time sync, email reminders, import/export from Jira,
a 6-step creation wizard (UIPlan §18) — quick create + full form cover the need.
